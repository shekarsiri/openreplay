package main

import (
	"log"
	"openreplay/backend/internal/config/ender"
	"openreplay/backend/internal/sessionender"
	"openreplay/backend/pkg/db/cache"
	"openreplay/backend/pkg/db/postgres"
	"openreplay/backend/pkg/monitoring"
	"time"

	"os"
	"os/signal"
	"syscall"

	"openreplay/backend/pkg/intervals"
	logger "openreplay/backend/pkg/log"
	"openreplay/backend/pkg/messages"
	"openreplay/backend/pkg/queue"
	"openreplay/backend/pkg/queue/types"
)

//
func main() {
	metrics := monitoring.New("ender")

	log.SetFlags(log.LstdFlags | log.LUTC | log.Llongfile)

	// Load service configuration
	cfg := ender.New()

	pg := cache.NewPGCache(postgres.NewConn(cfg.Postgres, 0, 0, metrics), cfg.ProjectExpirationTimeoutMs)
	defer pg.Close()

	// Init all modules
	statsLogger := logger.NewQueueStats(cfg.LoggerTimeout)
	sessions, err := sessionender.New(metrics, intervals.EVENTS_SESSION_END_TIMEOUT, cfg.PartitionsNumber)
	if err != nil {
		log.Printf("can't init ender service: %s", err)
		return
	}
	producer := queue.NewProducer(cfg.MessageSizeLimit, true)
	consumer := queue.NewMessageConsumer(
		cfg.GroupEnder,
		[]string{
			cfg.TopicRawWeb,
		},
		func(sessionID uint64, msg messages.Message, meta *types.Meta) {
			switch msg.(type) {
			case *messages.SessionStart, *messages.SessionEnd:
				// Skip several message types
				return
			}
			// Test debug
			if msg.Meta().Timestamp == 0 {
				log.Printf("ZERO TS, sessID: %d, msgType: %d", sessionID, msg.TypeID())
			}
			statsLogger.Collect(sessionID, meta)
			sessions.UpdateSession(sessionID, meta.Timestamp, msg.Meta().Timestamp)
		},
		false,
		cfg.MessageSizeLimit,
	)

	log.Printf("Ender service started\n")

	sigchan := make(chan os.Signal, 1)
	signal.Notify(sigchan, syscall.SIGINT, syscall.SIGTERM)

	tick := time.Tick(intervals.EVENTS_COMMIT_INTERVAL * time.Millisecond)
	for {
		select {
		case sig := <-sigchan:
			log.Printf("Caught signal %v: terminating\n", sig)
			producer.Close(cfg.ProducerTimeout)
			if err := consumer.CommitBack(intervals.EVENTS_BACK_COMMIT_GAP); err != nil {
				log.Printf("can't commit messages with offset: %s", err)
			}
			consumer.Close()
			os.Exit(0)
		case <-tick:
			// Find ended sessions and send notification to other services
			sessions.HandleEndedSessions(func(sessionID uint64, timestamp int64) bool {
				msg := &messages.SessionEnd{Timestamp: uint64(timestamp)}
				if err := pg.InsertSessionEnd(sessionID, msg.Timestamp); err != nil {
					log.Printf("can't save sessionEnd to database, sessID: %d, err: %s", sessionID, err)
					return false
				}
				if err := producer.Produce(cfg.TopicRawWeb, sessionID, messages.Encode(msg)); err != nil {
					log.Printf("can't send sessionEnd to topic: %s; sessID: %d", err, sessionID)
					return false
				}
				return true
			})
			producer.Flush(cfg.ProducerTimeout)
			if err := consumer.CommitBack(intervals.EVENTS_BACK_COMMIT_GAP); err != nil {
				log.Printf("can't commit messages with offset: %s", err)
			}
		default:
			if err := consumer.ConsumeNext(); err != nil {
				log.Fatalf("Error on consuming: %v", err)
			}
		}
	}
}

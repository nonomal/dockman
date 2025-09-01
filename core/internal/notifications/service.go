package notifications

import (
	"context"
	"fmt"

	"github.com/RA341/dockman/pkg/syncmap"
	"github.com/nikoksr/notify"
	"github.com/nikoksr/notify/service/telegram"
	"github.com/rs/zerolog/log"
)

/*
TODO
## Notifications

> [!IMPORTANT]
> Dockman updater is only available on ```ghcr.io/ra341/dockman:main``` tag only
>
> and is currently in testing expect bugs


Configure dockman to send notifications on certain events

Events config

Available Providers

1. Email
2. Discord
3. Slack
4. Telegram
5. Http

*/

var std *Service

func Send(mes *NotifMessage) {
	std.send(mes)
}

func InitNotificationService(store Store) {
	std = newService(store)
}

// NotifQueueSize max 100 notifs allowed to be queued
const NotifQueueSize = 100

type NotifMessage struct {
	level         Level
	Subject, Body string
}

type Service struct {
	store Store

	posts syncmap.Map[Level, chan NotifMessage]

	notifChan chan *NotifMessage
}

func newService(store Store) *Service {
	return &Service{
		store:     store,
		notifChan: make(chan *NotifMessage, NotifQueueSize),
	}
}

func (srv *Service) send(notifs *NotifMessage) {
	configs, err := srv.store.GetAllByLevel(notifs.level)
	if err != nil {
		log.Warn().Err(err).Msg("unable to get notif configs")
		return
	}

	for _, config := range configs {
		cal, ok := config.Config["sds"]
		loadExternalService(config.Config)

	}

	val, ok := srv.posts.Load(notifs.level)
	if !ok {
		srv.posts.Load()
	}
}

type notificationProviders string

const (
	TelegramProvider = "telegram"
	DiscordProvider  = "discord"
	SlackProvider    = "slack"
	EmailProvider    = "email"
	WebhookProvider  = "webhook"
)

type providerInit func(conf Config) (notify.Notifier, error)

var supportedNotifs = map[notificationProviders]providerInit{
	TelegramProvider: func(conf Config) (notify.Notifier, error) {
		val, ok := conf["apiToken"].(string)
		if !ok {
			return nil, fmt.Errorf("unable to get apitoken")
		}

		t, err := telegram.New(val)
		if err != nil {
			return nil, err
		}

		r, ok := conf["receivers"].([]int64)
		if ok {
			t.AddReceivers(r...)
		}

		return t, nil
	},
	DiscordProvider: func(conf Config) (notify.Notifier, error) {

	},
}

func loadExternalService(config Config) error {
	val, ok := config["type"].(string)
	if !ok {
		return nil
	}

	switch val {
	case "telegram":
		return loadTelegram(config)
	default:
		return nil
	}
}

func createNewLevelWorker(level Level) chan NotifMessage {
	levelChan := make(chan NotifMessage, 50)
	go notifWorker(levelChan, notifiers)
}

func notifWorker(stream chan NotifMessage, srv ...notify.Notifier) {

	for {
		select {
		case notifMsg, ok := <-stream:
			if !ok {
				return
			}

		}
	}
}

// blocking function must be run a go routine
func sendNotifs() {
	//// Create a telegram service. Ignoring error for demo simplicity.
	//telegramService, _ := telegram.New("your_telegram_api_token")
	//
	//// Passing a telegram chat id as receiver for our messages.
	//// Basically where should our message be sent?
	//telegramService.AddReceivers(-1234567890)

	//notify.UseServices(telegramService)
}

func send(subject, body string) {
	err := notify.Send(context.Background(), subject, body)
	if err != nil {
		log.Error().Err(err).Msg("failed to send notification")
	}
}
func (srv *Service) loadNotifiers() {

}

func loadTelegram(config Config) error {
}

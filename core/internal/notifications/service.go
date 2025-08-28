package notifications

import (
	"context"

	"github.com/nikoksr/notify"
	"github.com/rs/zerolog/log"
)

type Service struct{}

func NewService() {
	//// Create a telegram service. Ignoring error for demo simplicity.
	//telegramService, _ := telegram.New("your_telegram_api_token")
	//
	//// Passing a telegram chat id as receiver for our messages.
	//// Basically where should our message be sent?
	//telegramService.AddReceivers(-1234567890)

	// Tell our notifier to use the telegram service. You can repeat the above process
	// for as many services as you like and just tell the notifier to use them.
	// Inspired by http middlewares used in higher level libraries.
	//notify.UseServices(telegramService)
}

func Send(subject, body string) {
	err := notify.Send(context.Background(), subject, body)
	if err != nil {
		log.Error().Err(err).Msg("failed to send notification")
	}
}

func (srv *Service) loadNotifiers() {
	//telegram.New()
}

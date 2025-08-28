package notifications

import (
	"context"

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

type Service struct{}

func NewService() {
	//// Create a telegram service. Ignoring error for demo simplicity.
	//telegramService, _ := telegram.New("your_telegram_api_token")
	//
	//// Passing a telegram chat id as receiver for our messages.
	//// Basically where should our message be sent?
	//telegramService.AddReceivers(-1234567890)

	//notify.UseServices(telegramService)
}

func Send(subject, body string) {
	err := notify.Send(context.Background(), subject, body)
	if err != nil {
		log.Error().Err(err).Msg("failed to send notification")
	}
}

func (srv *Service) loadNotifiers() {

}

func loadTelegram(apiToken string, receivers []int64) error {
	t, err := telegram.New(apiToken)
	if err != nil {
		return err
	}
	t.AddReceivers(receivers...)
	return nil
}

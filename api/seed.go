package main

import (
	"context"
	"log"
	"tidy/ent"
)

func seedData() {
	client, err := ent.Open("sqlite3", "file:test.db?_fk=1")
	if err != nil {
		log.Fatalf("failed opening connection to sqlite: %v", err)
	}
	defer client.Close()

	ctx := context.Background()

	if err := client.Schema.Create(ctx); err != nil {
		log.Fatalf("failed creating schema resources: %v", err)
	}

	gamingNewsletter, err := client.Newsletter.Create().
		SetName("Gaming Newsletter").
		SetDescription("Newsletter with gaming news.").
		Save(ctx)
	if err != nil {
		log.Fatalf("failed creating gaming newsletter: %v", err)
	}

	_,_ = client.Newsletter.Create().
		SetName("Tech Newsletter").
		SetDescription("Newsletter with tec news.").
		Save(ctx)
	if err != nil {
		log.Fatalf("failed creating tech newsletter: %v", err)
	}

	actuGamingScraperSchema, err := client.ScraperSchema.Create().
		SetContainer("div.p-l-card__container").
		SetTitle("h3").
		SetDescription("p.tw-text-base").
		SetImage("img.h-thumbnail__image").
		SetTime("time.tw-text-sm").
		SetLink("a.stretched-link").
		Save(ctx)
	if err != nil {
		log.Fatalf("failed creating actu gaming schema: %v", err)
	}

	jeuxVideoScraperSchema, err := client.ScraperSchema.Create().
		SetContainer("li.cardList__item").
		SetTitle("h2 a").
		SetDescription("div.cardHorizontalList__description").
		SetImage("img").
		SetTime("div.cardHorizontalList__legend").
		SetLink("h2 a").
		Save(ctx)
	if err != nil {
		log.Fatalf("failed creating jeux video schema: %v", err)
	}

	jeuxActuScraperSchema, err := client.ScraperSchema.Create().
		SetContainer("div.lst_actus div").
		SetTitle("span.title.block").
		SetDescription("span.hometext").
		SetImage("img.lazy.lazyloaded").
		SetTime("span.nobold.black").
		SetLink("a.block").
		Save(ctx)
	if err != nil {
		log.Fatalf("failed creating jeux actu schema: %v", err)
	}

	// Création des Scrapers
	actuGamingScraper, err := client.Scraper.Create().
		SetName("Actu Gaming scraper").
		SetLink("https://www.actugaming.net/actualites").
		SetPremium(false).
		SetSchema(actuGamingScraperSchema).
		Save(ctx)
	if err != nil {
		log.Fatalf("failed creating actu gaming scraper: %v", err)
	}

	jeuxVideoScraper, err := client.Scraper.Create().
		SetName("Jeux vidéo scraper").
		SetLink("https://www.jeuxvideo.com/toutes-les-news/").
		SetPremium(true).
		SetSchema(jeuxVideoScraperSchema).
		Save(ctx)
	if err != nil {
		log.Fatalf("failed creating jeux video scraper: %v", err)
	}

	jeuxActuScraper, err := client.Scraper.Create().
		SetName("Jeux Actu scraper").
		SetLink("https://www.jeuxactu.com/").
		SetPremium(false).
		SetSchema(jeuxActuScraperSchema).
		Save(ctx)
	if err != nil {
		log.Fatalf("failed creating jeux actu scraper: %v", err)
	}

	jobActuGaming, err := client.CronJob.Create().
		SetName("Job Actu Gaming").
		SetTime("@every 10h00m00s").
		SetNewsletter(gamingNewsletter).
		AddScrapers(actuGamingScraper).
		Save(ctx)
	if err != nil {
		log.Fatalf("failed creating job actu gaming: %v", err)
	}

	jobJeuxVideo, err := client.CronJob.Create().
		SetName("Job Jeux vidéo").
		SetTime("@every 10h00m00s").
		SetNewsletter(gamingNewsletter).
		AddScrapers(jeuxVideoScraper).
		Save(ctx)
	if err != nil {
		log.Fatalf("failed creating job jeux video: %v", err)
	}

	jobJeuxActu, err := client.CronJob.Create().
		SetName("Job Jeux Actu").
		SetTime("@every 00h00m30s").
		SetNewsletter(gamingNewsletter).
		AddScrapers(jeuxActuScraper).
		Save(ctx)
	if err != nil {
		log.Fatalf("failed creating job jeux actu: %v", err)
	}

	user, err := client.User.Create().
		SetEmail("tristan.lavocat.pro@gmail.com").
		SetNewsletter(gamingNewsletter).
		Save(ctx)

	if err != nil {
		log.Fatalf("failed creating user: %v", err)
	}

	log.Printf("✅ Seed terminé avec succès!")
	log.Printf("📧 Créé %d Newsletter", 1)
	log.Printf("📊 Créé %d ScraperSchemas", 3)
	log.Printf("🕷️  Créé %d Scrapers", 3)
	log.Printf("⏰ Créé %d CronJobs", 3)
	log.Printf("👤 Créé %d User", 1)
	log.Printf("📋 Détails:")
	log.Printf("   - Newsletter: %s (ID: %d)", gamingNewsletter.Name, gamingNewsletter.ID)
	log.Printf("   - Job Actu Gaming (ID: %d)", jobActuGaming.ID)
	log.Printf("   - Job Jeux vidéo (ID: %d)", jobJeuxVideo.ID)
	log.Printf("   - Job Jeux Actu (ID: %d)", jobJeuxActu.ID)
	log.Printf("   - User: %s (ID: %d)", user.Email, user.ID)
}

func clearData() {
	client, err := ent.Open("sqlite3", "file:test.db?_fk=1")
	if err != nil {
		log.Fatalf("failed opening connection to sqlite: %v", err)
	}
	defer client.Close()

	ctx := context.Background()

	if err := client.Schema.Create(ctx); err != nil {
		log.Fatalf("failed creating schema resources: %v", err)
	}

	// Suppression en cascade (grâce aux relations)
	// Ordre : d'abord les CronJobs, puis les Scrapers, puis les ScraperSchemas, puis les Users, puis les Newsletters
	_, err = client.CronJob.Delete().Exec(ctx)
	if err != nil {
		log.Fatalf("failed deleting cronjobs: %v", err)
	}

	_, err = client.Scraper.Delete().Exec(ctx)
	if err != nil {
		log.Fatalf("failed deleting scrapers: %v", err)
	}

	_, err = client.ScraperSchema.Delete().Exec(ctx)
	if err != nil {
		log.Fatalf("failed deleting scraper schemas: %v", err)
	}

	_, err = client.User.Delete().Exec(ctx)
	if err != nil {
		log.Fatalf("failed deleting users: %v", err)
	}

	_, err = client.Newsletter.Delete().Exec(ctx)
	if err != nil {
		log.Fatalf("failed deleting newsletters: %v", err)
	}

	log.Printf("🗑️  Toutes les données ont été supprimées")
} 
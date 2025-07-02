package main

import (
	"context"
	"log"
	"tidy/ent"
	"tidy/ent/newsletter"
	"tidy/ent/user"

	_ "github.com/mattn/go-sqlite3"
)

func subscribe(email string, newsletterName string) {
	client, err := ent.Open("sqlite3", "file:test.db?_fk=1")
	if err != nil {
		log.Fatalf("failed opening connection to sqlite: %v", err)
	}
	defer client.Close()

	ctx := context.Background()

	// Récupérer la newsletter par son nom
	newsletter, err := client.Newsletter.Query().
		Where(newsletter.NameEQ(newsletterName)).
		First(ctx)
	if err != nil {
		log.Fatalf("failed getting newsletter '%s': %v", newsletterName, err)
	}

	user, err := client.User.
		Create().
		SetEmail(email).
		SetNewsletter(newsletter).
		Save(ctx)
	if err != nil {
		log.Fatalf("failed creating user: %v", err)
	}
	log.Printf("user subscribed to newsletter: %v", user)
}

func deleteUser(email string) {
	client, err := ent.Open("sqlite3", "file:test.db?_fk=1")
	if err != nil {
		log.Fatalf("failed opening connection to sqlite: %v", err)
	}
	defer client.Close()

	ctx := context.Background()

	u, err := client.User.
		Query().
		Where(user.EmailEQ(email)).
		Only(ctx)

	if err != nil {
		log.Fatalf("user not found : %v", err)
	}

	err = client.User.
		DeleteOneID(u.ID).
		Exec(ctx)

	if err != nil {
		log.Fatalf("error while deleting the user : %v", err)
	}

	log.Printf("User delete : %v", u)
}

func getUsers() ([]*ent.User) {
	client, err := ent.Open("sqlite3", "file:test.db?_fk=1")
	if err != nil {
		log.Fatalf("failed opening connection to sqlite: %v", err)
	}
	defer client.Close()

	ctx := context.Background()

	if err := client.Schema.Create(ctx); err != nil {
		log.Fatalf("failed creating schema resources: %v", err)
	}

	users, err := client.User.Query().
		WithNewsletter().
		All(ctx)
	if err != nil {
		log.Fatalf("failed querying users: %v", err)
	}

	return users
}

func getCronJobs() ([]*ent.CronJob) {
	client, err := ent.Open("sqlite3", "file:test.db?_fk=1")
	if err != nil {
		log.Fatalf("failed opening connection to sqlite: %v", err)
	}
	defer client.Close()

	ctx := context.Background()

	if err := client.Schema.Create(ctx); err != nil {
		log.Fatalf("failed creating schema resources: %v", err)
	}

	cronJobs, err := client.CronJob.Query().
		WithNewsletter().
		WithScrapers(func(q *ent.ScraperQuery) {
			q.WithSchema()  // Charge aussi les schemas des scrapers
		}).
		All(ctx)
	if err != nil {
		log.Fatalf("failed querying cronjobs : %v", err)
	}

	return cronJobs
}

func connect() (*ent.Client) {
	client, err := ent.Open("sqlite3", "file:test.db?_fk=1")
	if err != nil {
		log.Fatalf("failed opening connection to sqlite: %v", err)
	}
	defer client.Close()

	ctx := context.Background()

	// Migration automatique
	if err := client.Schema.Create(ctx); err != nil {
		log.Fatalf("failed creating schema resources: %v", err)
	}

	return client
}
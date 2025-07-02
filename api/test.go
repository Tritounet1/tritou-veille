package main

/*
	Fichier des tests de base de données ou scrapers
*/

import (
	"context"
	"fmt"
	"log"
	"tidy/ent"

	_ "github.com/mattn/go-sqlite3"
)

func testRelations() {
	client, err := ent.Open("sqlite3", "file:test.db?_fk=1")
	if err != nil {
		log.Fatalf("failed opening connection to sqlite: %v", err)
	}
	defer client.Close()

	ctx := context.Background()

	// Test 1: Récupérer les CronJobs avec leurs Scrapers
	fmt.Println("=== Test 1: CronJobs avec Scrapers ===")
	cronJobs, err := client.CronJob.Query().
		WithScrapers().
		All(ctx)
	if err != nil {
		log.Fatalf("failed querying cronjobs: %v", err)
	}

	for _, job := range cronJobs {
		fmt.Printf("Job: %s (ID: %d)\n", job.Name, job.ID)
		fmt.Printf("  Time: %s\n", job.Time)
		fmt.Printf("  Scrapers: %d\n", len(job.Edges.Scrapers))
		for _, scraper := range job.Edges.Scrapers {
			fmt.Printf("    - %s (ID: %d, Link: %s)\n", scraper.Name, scraper.ID, scraper.Link)
		}
		fmt.Println()
	}

	// Test 2: Récupérer les Scrapers avec leurs Schemas
	fmt.Println("=== Test 2: Scrapers avec Schemas ===")
	scrapers, err := client.Scraper.Query().
		WithSchema().
		All(ctx)
	if err != nil {
		log.Fatalf("failed querying scrapers: %v", err)
	}

	for _, scraper := range scrapers {
		fmt.Printf("Scraper: %s (ID: %d)\n", scraper.Name, scraper.ID)
		fmt.Printf("  Link: %s\n", scraper.Link)
		fmt.Printf("  Premium: %t\n", scraper.Premium)
		if scraper.Edges.Schema != nil {
			fmt.Printf("  Schema: Container=%s, Title=%s\n", 
				scraper.Edges.Schema.Container, scraper.Edges.Schema.Title)
		} else {
			fmt.Printf("  Schema: Aucun\n")
		}
		fmt.Println()
	}

	// Test 3: Compter les entités
	fmt.Println("=== Test 3: Comptage des entités ===")
	cronCount, _ := client.CronJob.Query().Count(ctx)
	scraperCount, _ := client.Scraper.Query().Count(ctx)
	schemaCount, _ := client.ScraperSchema.Query().Count(ctx)
	
	fmt.Printf("CronJobs: %d\n", cronCount)
	fmt.Printf("Scrapers: %d\n", scraperCount)
	fmt.Printf("ScraperSchemas: %d\n", schemaCount)
}

func runScraper() {
	/* */
}
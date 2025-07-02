package main

import (
	"fmt"

	"github.com/robfig/cron/v3"
)

func startCron() {
 
	// Create a new cron job instance
	c := cron.New()

	jobs := getCronJobs()
 
	// Start the cron for scrape every hour all latest blogs of ActuGaming
	for _, job := range jobs {
		fmt.Println(job.Name, "started.")
		scrapers := job.Edges.Scrapers
		for _, scraper := range scrapers {
			fmt.Printf("🕒 Tâche planifiée à %s pour le scraper '%s' 🤖\n", job.Time, scraper.Name)
			scraperCopy := scraper
			c.AddFunc(job.Time, func() { personalScraper(scraperCopy) })
		}
	}

	// Start the cron job scheduler 
	c.Start()
 
	// Keep the main program running
	// select {}
	// décommenter si avec gin ça ne marche pas.
 }

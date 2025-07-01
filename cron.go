package main

import (
	"fmt"

	"github.com/robfig/cron/v3"
)

func startCron() {
	fmt.Println("Start Cron Job")
 
	// Create a new cron job instance
	c := cron.New()
 
	// Start the cron for scrape every hour all latest blogs of ActuGaming
	c.AddFunc("@every 10h00m00s", scrapeActuGaming)
 
	// Start the cron job scheduler
	c.Start()
 
	// Keep the main program running
	select {}
 }

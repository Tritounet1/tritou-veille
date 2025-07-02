package main

import (
	"log"
	"os"
)

func main() {
	if len(os.Args) > 1 {
		switch os.Args[1] {
		case "seed":
			seedData()
			return
		case "clear":
			clearData()
			return
		case "help":
			log.Printf("Usage:")
			log.Printf("  go run .          - Lance l'application normale")
			log.Printf("  go run . seed     - Initialise la base avec les données de test")
			log.Printf("  go run . clear    - Supprime toutes les données")
			log.Printf("  go run . start-cron     - Lance les cron jobs")
			log.Printf("  go run . help     - Affiche cette aide")
			return
		case "start-cron": 
			log.Printf("Lancement des Cron Jobs")
			startCron()
			return
		}
	}
}
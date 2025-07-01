package main

import (
	"fmt"

	"github.com/robfig/cron/v3"
)

var (
	jobs = []cronJob {
		{name: "Job Actu Gaming", time: "@every 10h00ms", 
			scraper: scraper{name: "Actu Gaming scraper", link: "https://www.actugaming.net/actualites", premium: false,
				schema: scrapingSchema{
					container: "div.p-l-card__container",	
					title: "h3",
					description: "p.tw-text-base",
					image: "img.h-thumbnail__image",
					time: "time.tw-text-sm",
					link: "a.stretched-link",
				},
			},
		},
		{name: "Job Jeux vidéo", time: "@every 10h00m00s", 
			scraper: scraper{name: "Jeux vidéo scraper", link: "https://www.jeuxvideo.com/toutes-les-news/", premium: true,
				schema: scrapingSchema{
					container: "li.cardList__item",	
					title: "h2 a",
					description: "div.cardHorizontalList__description",
					image: "img",
					time: "div.cardHorizontalList__legend",
					link: "h2 a",
				},
			},
		},
		{name: "Job Jeux Actu", time: "@every 00h00m10s", 
			scraper: scraper{name: "Jeux Actu scraper", link: "https://www.jeuxactu.com/", premium: false,
				schema: scrapingSchema{
					container: "div.lst_actus div",	
					title: "span.title.block",
					description: "span.hometext",
					image: "img",
					time: "span.nobold.black",
					link: "a.block",
				},
			},
		},
	}
)

/* Il faudrait rajouter la partie :
pour les images / link : choisir si c'est href ou src... (choisir l'attribut)


		data := map[string]interface{}{
			"title":    s.Find("h3").Text(),
			"description":   s.Find("p.tw-text-base").Text(),
			"image": func() string {
				src, _ := s.Find("img.h-thumbnail__image").Attr("src")
				return src
			}(),
			"time": s.Find("time.tw-text-sm").Text(),
			"link": func() string {
				src, _ := s.Find("a.stretched-link").Attr("href")
				return src
			}(),
		}

Aussi pouvoir choisir si on scrape avec les conteneurs ou si l'article est dans la page. (page de recherche d'article ou page de l'article directement) ?
*/

func startCron() {
	fmt.Println("Start Cron Job")
 
	// Create a new cron job instance
	c := cron.New()
 
	// Start the cron for scrape every hour all latest blogs of ActuGaming
	for _, job := range jobs {
		fmt.Println(job.name, "started.")
		c.AddFunc(job.time, func() { personalScraper(job.scraper) })
	}

	// Start the cron job scheduler 
	c.Start()
 
	// Keep the main program running
	select {}
 }

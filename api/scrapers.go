package main

import (
	"context"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"tidy/ent"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/chromedp/chromedp"
	"github.com/joho/godotenv"
)

func GetPage(link string)(string) {
    res, err := http.Get(link)
    if err != nil {
        log.Fatal(err)
    }
    content, err := io.ReadAll(res.Body)
    if err != nil {
        log.Fatal(err)
    }
    return string(content)
}

func GetPagePremium(link string) string {
	// Création du contexte avec timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Création des options pour Chrome headless
	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.Flag("headless", true),
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("no-sandbox", true),
		chromedp.Flag("disable-dev-shm-usage", true),
		chromedp.Flag("disable-web-security", true),
		chromedp.Flag("disable-features", "VizDisplayCompositor"),
		chromedp.UserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"),
	)

	// Création de l'allocateur
	allocCtx, cancel := chromedp.NewExecAllocator(ctx, opts...)
	defer cancel()

	// Création du contexte de tâche
	taskCtx, cancel := chromedp.NewContext(allocCtx, chromedp.WithLogf(log.Printf))
	defer cancel()

	var html string

	// Exécution des tâches
	err := chromedp.Run(taskCtx,
		// Navigation vers la page
		chromedp.Navigate(link),
		// Attendre que la page soit complètement chargée
		chromedp.WaitReady("body", chromedp.ByQuery),
		// Attendre un peu plus pour s'assurer que le JavaScript a fini de s'exécuter
		chromedp.Sleep(2*time.Second),
		// Récupérer l'HTML de la page
		chromedp.OuterHTML("html", &html),
	)

	if err != nil {
		log.Printf("Erreur lors du chargement de la page %s: %v", link, err)
		return ""
	}

	log.Printf("✅ Page %s chargée avec succès via navigateur headless", link)
	return html
}

func extractHostname(link string) (hostname string) {
	return strings.Split(link, "/")[1]
}

func personalScraper(scraperDetails *ent.Scraper) {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Erreur lors du chargement du .env")
	}
	
	link := scraperDetails.Link

	hostName := extractHostname(link)

	var html string

	if(scraperDetails.Premium) {
		html = GetPagePremium(link)
	} else {
		html = GetPage(link)
	}

    err = os.WriteFile("index.html", []byte(html), 0644)
    if err != nil {
		log.Fatal(err)
	}

	doc, err := goquery.NewDocumentFromReader(strings.NewReader(html))
    if err != nil {
        log.Fatal(err)
    }

	lastBlogs := make([]map[string]interface{}, 0)

    doc.Find(scraperDetails.Edges.Schema.Container).Each(func(i int, s *goquery.Selection) {
		data := map[string]interface{}{
			"title":    s.Find(scraperDetails.Edges.Schema.Title).Text(),
			"description":   s.Find(scraperDetails.Edges.Schema.Description).Text(),
			"image": func() string {
				src, _ := s.Find(scraperDetails.Edges.Schema.Image).Attr("src")
				if(!strings.Contains(src, "https")) {
					src = "https://" + hostName + "/" + src
				}
				return src
			}(),
			"time": s.Find(scraperDetails.Edges.Schema.Time).Text(),
			"link": func() string {
				src, _ := s.Find(scraperDetails.Edges.Schema.Link).Attr("href")
				if(!strings.Contains(src, "https")) {
					src = "https://" + hostName + "/" + src
				}
				return src
			}(),
		}
		lastBlogs = append(lastBlogs, data)
    })

	users := getUsers()

	for _, u := range users {
		sendMail(u.Email, lastBlogs)
	}


	// Sauvegarder le tableau complet dans un fichier JSON bien formaté
	/*
	jsonData, err := json.MarshalIndent(lastBlogs, "", "  ")
	if err != nil {
		log.Fatal("Erreur lors de la sérialisation JSON:", err)
	}

	err = os.WriteFile("blogs.json", jsonData, 0644)
	if err != nil {
		log.Fatal("Erreur lors de l'écriture du fichier:", err)
	}

	fmt.Printf("Données sauvegardées dans blogs.json (%d articles)\n", len(lastBlogs))
	*/
}
package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/PuerkitoBio/goquery"
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

func scrapeActuGaming() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Erreur lors du chargement du .env")
	}

	sendTo := os.Getenv("SEND_TO")
	
	link := "https://www.actugaming.net/actualites/"

	html := GetPage(link)

	/*
    err := os.WriteFile("index.html", []byte(html), 0644)
    if err != nil {
		log.Fatal(err)
	}
	*/

	doc, err := goquery.NewDocumentFromReader(strings.NewReader(html))
    if err != nil {
        log.Fatal(err)
    }

	lastBlogs := make([]map[string]interface{}, 0)

    doc.Find("div.p-l-card__container").Each(func(i int, s *goquery.Selection) {
        fmt.Println(s)
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
	
		/*
		jsonData, err := json.Marshal(data)
		if err != nil {
			fmt.Printf("could not marshal json: %s\n", err)
			return
		}
	
		fmt.Printf("json data: %s\n", jsonData)
		*/

		lastBlogs = append(lastBlogs, data)
    })

	// Envoi de l'e-mail avec les données des blogs
	sendMail(sendTo, lastBlogs)

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
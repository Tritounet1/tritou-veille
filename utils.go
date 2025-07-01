package main

import (
	"crypto/tls"
	"fmt"
	"log"
	"net/smtp"
	"os"

	"github.com/joho/godotenv"
)

func sendMail(to string, blogs []map[string]interface{}) {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Erreur lors du chargement du .env")
	}

	from := os.Getenv("SMTP_EMAIL")
	password := os.Getenv("SMTP_PASSWORD")
	serverName := os.Getenv("SMTP_SERVER_NAME")
	port := os.Getenv("SMTP_PORT")

	// Création du contenu HTML avec tableau des blogs
	tableRows := ""
	for _, blog := range blogs {
		title := fmt.Sprintf("%v", blog["title"])
		description := fmt.Sprintf("%v", blog["description"])
		image := fmt.Sprintf("%v", blog["image"])
		time := fmt.Sprintf("%v", blog["time"])
		link := fmt.Sprintf("%v", blog["link"])
		
		tableRows += fmt.Sprintf(`
			<tr style="border-bottom: 1px solid #ddd;">
				<td style="padding: 12px; text-align: center;">
					<img src="%s" alt="Image" style="max-width: 100px; height: auto; border-radius: 4px;">
				</td>
				<td style="padding: 12px;">
					<h3 style="margin: 0 0 8px 0; color: #007BFF;">%s</h3>
					<p style="margin: 0; color: #666; font-size: 14px;">%s</p>
					<p style="margin: 4px 0 0 0; color: #999; font-size: 12px;">📅 %s</p>
					<a href="%s" style="color: #007BFF; text-decoration: none; font-size: 12px;">🔗 Lire l'article</a>
				</td>
			</tr>`, image, title, description, time, link)
	}

	// Création du message HTML
	message := []byte(fmt.Sprintf(
		"From: %s\r\n"+
			"To: %s\r\n"+
			"Subject: Dernières actualités gaming ! 🎮\r\n"+
			"MIME-Version: 1.0\r\n"+
			"Content-Type: text/html; charset=\"UTF-8\"\r\n"+
			"\r\n"+
			"<html><body style=\"font-family:Arial,sans-serif; color:#333; margin: 0; padding: 20px;\">\r\n"+
			"<div style=\"max-width: 800px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px;\">\r\n"+
			"<h1 style=\"color:#007BFF; text-align: center; margin-bottom: 30px;\">🎮 Actualités Gaming</h1>\r\n"+
			"<p style=\"text-align: center; color: #666; margin-bottom: 30px;\">Voici les dernières actualités récupérées depuis <strong>ActuGaming.net</strong></p>\r\n"+
			"<table style=\"width: 100%%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);\">\r\n"+
			"<thead>\r\n"+
			"<tr style=\"background: #007BFF; color: white;\">\r\n"+
			"<th style=\"padding: 15px; text-align: center; width: 120px;\">Image</th>\r\n"+
			"<th style=\"padding: 15px; text-align: left;\">Article</th>\r\n"+
			"</tr>\r\n"+
			"</thead>\r\n"+
			"<tbody>\r\n"+
			"%s\r\n"+
			"</tbody>\r\n"+
			"</table>\r\n"+
			"<div style=\"text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;\">\r\n"+
			"<p style=\"font-size: 12px; color: #888;\">📧 Message automatique généré par TritouBot </p>\r\n"+
			"<p style=\"font-size: 12px; color: #888;\">Total d'articles : <strong>%d</strong></p>\r\n"+
			"</div>\r\n"+
			"</div>\r\n"+
			"</body></html>\r\n",
		from, to, tableRows, len(blogs)))

	// Connexion SSL directe sur port
	tlsconfig := &tls.Config{
		InsecureSkipVerify: false,
		ServerName:         serverName,
	}

	conn, err := tls.Dial("tcp", (serverName+":"+port), tlsconfig)
	if err != nil {
		log.Fatal("Erreur TLS Dial :", err)
	}

	// Création du client SMTP à partir de la connexion sécurisée
	client, err := smtp.NewClient(conn, serverName)
	if err != nil {
		log.Fatal("Erreur création client SMTP :", err)
	}

	// Authentification
	auth := smtp.PlainAuth("", from, password, serverName)
	if err = client.Auth(auth); err != nil {
		log.Fatal("Erreur authentification SMTP :", err)
	}

	// Préparation de l'e-mail
	if err = client.Mail(from); err != nil {
		log.Fatal("Erreur MAIL FROM :", err)
	}
	if err = client.Rcpt(to); err != nil {
		log.Fatal("Erreur RCPT TO :", err)
	}

	// Envoi du corps du message
	w, err := client.Data()
	if err != nil {
		log.Fatal("Erreur ouverture Data :", err)
	}

	_, err = w.Write(message)
	if err != nil {
		log.Fatal("Erreur écriture du message :", err)
	}

	err = w.Close()
	if err != nil {
		log.Fatal("Erreur fermeture Data :", err)
	}

	client.Quit()
	log.Println("✅ E-mail avec tableau des blogs envoyé avec succès")
}

# Tritounet Scraper

## Description

C'est des scrapers qui récupère les derniers articles de blogs depuis des sites d’actualités et les envoie à un utilisateur par email.

C'est un projet créé pour mettre en place un système qui collecte des informations depuis les sites que nous suivons, afin d’envoyer automatiquement des mises à jour chaque jour dans le cadre d’un processus de veille automatisée.

(pour l'instant, que pour des blogs d'actualités de gaming, mais il sera possible de créer des scrapers personnalisés et de les ajouter dans les tâches cron)

## Usage

Créer une entité :

```bash
go new entityName
```

Générer les entités :

```bash
go run entgo.io/ent/cmd/ent generate ./ent/schema
```

Lancer l'application :

```bash
go run .
```

## CREATE DOCKER IMAGE

```bash
docker build -t tritounet-scraper .
```

## RUN DOCKER IMAGE

```bash
docker run -d --name tritounet-scraper tritounet-scraper
```

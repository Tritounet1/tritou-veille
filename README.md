# Tritou-veille

## Api

C'est des scrapers qui récupère les derniers articles de blogs depuis des sites d’actualités et les envoie à un utilisateur par email.

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

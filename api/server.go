package main

import (
	"net/http"
	"strconv"
	"tidy/ent"
	"tidy/ent/cronjob"
	"tidy/ent/newsletter"
	"tidy/ent/scraper"
	"tidy/ent/user"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
)

type ScraperSchemaDTO struct {
	ID          int    `json:"id"`
	Container   string `json:"container"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Image       string `json:"image"`
	Time        string `json:"time"`
	Link        string `json:"link"`
}

type ScraperDTO struct {
	ID      int             `json:"id"`
	Name    string          `json:"name"`
	Link    string          `json:"link"`
	Premium bool            `json:"premium"`
	Schema  *ScraperSchemaDTO `json:"schema,omitempty"`
}

type CronJobDTO struct {
	ID         int         `json:"id"`
	Name       string      `json:"name"`
	Time       string      `json:"time"`
	Newsletter *NewsletterDTO `json:"newsletter,omitempty"`
	Scrapers   []ScraperDTO `json:"scrapers"`
}

type NewsletterDTO struct {
	ID          int         `json:"id"`
	Name        string      `json:"name"`
	Description string      `json:"description"`
	Cronjobs    []CronJobDTO `json:"cronjobs"`
	Users       []UserDTO    `json:"users,omitempty"`
}

type UserDTO struct {
	ID         int            `json:"id"`
	Email      string         `json:"email"`
	Newsletter *NewsletterDTO `json:"newsletter,omitempty"`
}

func startServer() {
	r := gin.Default()
	r.Use(cors.Default())

	// Route de base
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "API Scraper Newsletter 🚀"})
	})

	// Routes pour les Newsletters
	r.POST("/newsletters", createNewsletter)
	r.GET("/newsletters", getNewsletters)
	r.GET("/newsletters/:id", getNewsletter)
	r.PUT("/newsletters/:id", updateNewsletter)
	r.DELETE("/newsletters/:id", deleteNewsletter)

	// Routes pour les ScraperSchemas
	r.POST("/schemas", createScraperSchema)
	r.GET("/schemas", getScraperSchemas)
	r.GET("/schemas/:id", getScraperSchema)
	r.PUT("/schemas/:id", updateScraperSchema)
	r.DELETE("/schemas/:id", deleteScraperSchema)

	// Routes pour les Scrapers
	r.POST("/scrapers", createScraper)
	r.GET("/scrapers", getScrapers)
	r.GET("/scrapers/:id", getScraper)
	r.PUT("/scrapers/:id", updateScraper)
	r.DELETE("/scrapers/:id", deleteScraper)

	// Routes pour les CronJobs
	r.POST("/cronjobs", createCronJob)
	r.GET("/cronjobs", getCronJobsAPI)
	r.GET("/cronjobs/:id", getCronJob)
	r.PUT("/cronjobs/:id", updateCronJob)
	r.DELETE("/cronjobs/:id", deleteCronJob)

	// Routes pour les Users
	r.POST("/users", createUser)
	r.GET("/users", getUsersAPI)
	r.GET("/users/:id", getUser)
	r.PUT("/users/:id", updateUser)
	r.DELETE("/users/:id", deleteUserAPI)

	// Routes pour les relations
	r.POST("/cronjobs/:id/scrapers", addScrapersToCronJob)
	r.DELETE("/cronjobs/:id/scrapers/:scraperId", removeScraperFromCronJob)
	r.POST("/newsletters/:id/users", addUsersToNewsletter)
	r.DELETE("/newsletters/:id/users/:userId", removeUserFromNewsletter)

	// Routes pour les actions
	r.POST("/start-cron", startCronHandler)
	r.POST("/seed", seedHandler)
	r.POST("/clear", clearHandler)

	r.Run(":8080")
}

// ===== NEWSLETTERS =====

func createNewsletter(c *gin.Context) {
	var input struct {
		Name string `json:"name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client := getClient()
	defer client.Close()

	newsletter, err := client.Newsletter.Create().
		SetName(input.Name).
		Save(c.Request.Context())

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, newsletter)
}

func getNewsletters(c *gin.Context) {
	client := getClient()
	defer client.Close()

	newsletters, err := client.Newsletter.Query().
		WithCronjobs().
		WithUsers().
		All(c.Request.Context())	

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convertir en DTOs
	var newsletterDTOs []NewsletterDTO
	for _, newsletter := range newsletters {
		// Convertir les cron jobs
		var cronJobDTOs []CronJobDTO
		for _, cronJob := range newsletter.Edges.Cronjobs {
			cronJobDTO := CronJobDTO{
				ID:   cronJob.ID,
				Name: cronJob.Name,
				Time: cronJob.Time,
			}
			cronJobDTOs = append(cronJobDTOs, cronJobDTO)
		}

		// Convertir les utilisateurs
		var userDTOs []UserDTO
		for _, user := range newsletter.Edges.Users {
			userDTO := UserDTO{
				ID:    user.ID,
				Email: user.Email,
			}
			userDTOs = append(userDTOs, userDTO)
		}

		newsletterDTO := NewsletterDTO{
			ID:          newsletter.ID,
			Name:        newsletter.Name,
			Description: newsletter.Description,
			Cronjobs:    cronJobDTOs,
			Users:       userDTOs,
		}
		newsletterDTOs = append(newsletterDTOs, newsletterDTO)
	}

	c.JSON(http.StatusOK, newsletterDTOs)
}

func getNewsletter(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	client := getClient()
	defer client.Close()

	n, err := client.Newsletter.Query().
		Where(newsletter.IDEQ(id)).
		WithCronjobs(func(q *ent.CronJobQuery) {
			q.WithScrapers(func(sq *ent.ScraperQuery) {
				sq.WithSchema()
			})
		}).
		Only(c.Request.Context())

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Newsletter not found"})
		return
	}

	// Construction de la réponse custom
	dto := NewsletterDTO{
		ID:          n.ID,
		Name:        n.Name,
		Description: n.Description,
		Cronjobs:    []CronJobDTO{},
	}

	for _, cj := range n.Edges.Cronjobs {
		cjDTO := CronJobDTO{
			ID:      cj.ID,
			Name:    cj.Name,
			Time:    cj.Time,
			Scrapers: []ScraperDTO{},
		}
		for _, s := range cj.Edges.Scrapers {
			var schema *ScraperSchemaDTO
			if s.Edges.Schema != nil {
				schema = &ScraperSchemaDTO{
					ID:          s.Edges.Schema.ID,
					Container:   s.Edges.Schema.Container,
					Title:       s.Edges.Schema.Title,
					Description: s.Edges.Schema.Description,
					Image:       s.Edges.Schema.Image,
					Time:        s.Edges.Schema.Time,
					Link:        s.Edges.Schema.Link,
				}
			}
			cjDTO.Scrapers = append(cjDTO.Scrapers, ScraperDTO{
				ID:      s.ID,
				Name:    s.Name,
				Link:    s.Link,
				Premium: s.Premium,
				Schema:  schema,
			})
		}
		dto.Cronjobs = append(dto.Cronjobs, cjDTO)
	}

	c.JSON(http.StatusOK, dto)
}

func updateNewsletter(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var input struct {
		Name string `json:"name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client := getClient()
	defer client.Close()

	newsletter, err := client.Newsletter.UpdateOneID(id).
		SetName(input.Name).
		Save(c.Request.Context())

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, newsletter)
}

func deleteNewsletter(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	client := getClient()
	defer client.Close()

	err = client.Newsletter.DeleteOneID(id).Exec(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Newsletter deleted"})
}

// ===== SCRAPER SCHEMAS =====

func createScraperSchema(c *gin.Context) {
	var input struct {
		Container   string `json:"container" binding:"required"`
		Title       string `json:"title" binding:"required"`
		Description string `json:"description" binding:"required"`
		Image       string `json:"image" binding:"required"`
		Time        string `json:"time" binding:"required"`
		Link        string `json:"link" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client := getClient()
	defer client.Close()

	schema, err := client.ScraperSchema.Create().
		SetContainer(input.Container).
		SetTitle(input.Title).
		SetDescription(input.Description).
		SetImage(input.Image).
		SetTime(input.Time).
		SetLink(input.Link).
		Save(c.Request.Context())

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, schema)
}

func getScraperSchemas(c *gin.Context) {
	client := getClient()
	defer client.Close()

	schemas, err := client.ScraperSchema.Query().All(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, schemas)
}

func getScraperSchema(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	client := getClient()
	defer client.Close()

	schema, err := client.ScraperSchema.Get(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Schema not found"})
		return
	}

	c.JSON(http.StatusOK, schema)
}

func updateScraperSchema(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var input struct {
		Container   string `json:"container"`
		Title       string `json:"title"`
		Description string `json:"description"`
		Image       string `json:"image"`
		Time        string `json:"time"`
		Link        string `json:"link"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client := getClient()
	defer client.Close()

	update := client.ScraperSchema.UpdateOneID(id)
	if input.Container != "" {
		update.SetContainer(input.Container)
	}
	if input.Title != "" {
		update.SetTitle(input.Title)
	}
	if input.Description != "" {
		update.SetDescription(input.Description)
	}
	if input.Image != "" {
		update.SetImage(input.Image)
	}
	if input.Time != "" {
		update.SetTime(input.Time)
	}
	if input.Link != "" {
		update.SetLink(input.Link)
	}

	schema, err := update.Save(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, schema)
}

func deleteScraperSchema(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	client := getClient()
	defer client.Close()

	err = client.ScraperSchema.DeleteOneID(id).Exec(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Schema deleted"})
}

// ===== SCRAPERS =====

func createScraper(c *gin.Context) {
	var input struct {
		Name     string `json:"name" binding:"required"`
		Link     string `json:"link" binding:"required"`
		Premium  bool   `json:"premium"`
		SchemaID int    `json:"schema_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client := getClient()
	defer client.Close()

	schema, err := client.ScraperSchema.Get(c.Request.Context(), input.SchemaID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Schema not found"})
		return
	}

	scraper, err := client.Scraper.Create().
		SetName(input.Name).
		SetLink(input.Link).
		SetPremium(input.Premium).
		SetSchema(schema).
		Save(c.Request.Context())

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, scraper)
}

func getScrapers(c *gin.Context) {
	client := getClient()
	defer client.Close()

	scrapers, err := client.Scraper.Query().
		WithSchema().
		All(c.Request.Context())

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, scrapers)
}

func getScraper(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	client := getClient()
	defer client.Close()

	scraper, err := client.Scraper.Query().
		Where(scraper.IDEQ(id)).
		WithSchema().
		Only(c.Request.Context())

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Scraper not found"})
		return
	}

	c.JSON(http.StatusOK, scraper)
}

func updateScraper(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var input struct {
		Name     string `json:"name"`
		Link     string `json:"link"`
		Premium  *bool  `json:"premium"`
		SchemaID *int   `json:"schema_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client := getClient()
	defer client.Close()

	update := client.Scraper.UpdateOneID(id)
	if input.Name != "" {
		update.SetName(input.Name)
	}
	if input.Link != "" {
		update.SetLink(input.Link)
	}
	if input.Premium != nil {
		update.SetPremium(*input.Premium)
	}
	if input.SchemaID != nil {
		schema, err := client.ScraperSchema.Get(c.Request.Context(), *input.SchemaID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Schema not found"})
			return
		}
		update.SetSchema(schema)
	}

	scraper, err := update.Save(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, scraper)
}

func deleteScraper(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	client := getClient()
	defer client.Close()

	err = client.Scraper.DeleteOneID(id).Exec(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Scraper deleted"})
}

// ===== CRON JOBS =====

func createCronJob(c *gin.Context) {
	var input struct {
		Name          string `json:"name" binding:"required"`
		Time          string `json:"time" binding:"required"`
		NewsletterID  int    `json:"newsletter_id" binding:"required"`
		ScraperIDs    []int  `json:"scraper_ids"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client := getClient()
	defer client.Close()

	newsletter, err := client.Newsletter.Get(c.Request.Context(), input.NewsletterID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Newsletter not found"})
		return
	}

	create := client.CronJob.Create().
		SetName(input.Name).
		SetTime(input.Time).
		SetNewsletter(newsletter)

	if len(input.ScraperIDs) > 0 {
		scrapers, err := client.Scraper.Query().
			Where(scraper.IDIn(input.ScraperIDs...)).
			All(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "One or more scrapers not found"})
			return
		}
		create.AddScrapers(scrapers...)
	}

	cronJob, err := create.Save(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, cronJob)
}

func getCronJobsAPI(c *gin.Context) {
	client := getClient()
	defer client.Close()

	cronJobs, err := client.CronJob.Query().
		WithNewsletter().
		WithScrapers(func(q *ent.ScraperQuery) {
			q.WithSchema()
		}).
		All(c.Request.Context())

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convertir en DTOs
	var cronJobDTOs []CronJobDTO
	for _, cronJob := range cronJobs {
		var scrapers []ScraperDTO
		for _, scraper := range cronJob.Edges.Scrapers {
			scraperDTO := ScraperDTO{
				ID:      scraper.ID,
				Name:    scraper.Name,
				Link:    scraper.Link,
				Premium: scraper.Premium,
			}
			if scraper.Edges.Schema != nil {
				scraperDTO.Schema = &ScraperSchemaDTO{
					ID:          scraper.Edges.Schema.ID,
					Container:   scraper.Edges.Schema.Container,
					Title:       scraper.Edges.Schema.Title,
					Description: scraper.Edges.Schema.Description,
					Image:       scraper.Edges.Schema.Image,
					Time:        scraper.Edges.Schema.Time,
					Link:        scraper.Edges.Schema.Link,
				}
			}
			scrapers = append(scrapers, scraperDTO)
		}

		var newsletterDTO *NewsletterDTO
		if cronJob.Edges.Newsletter != nil {
			newsletterDTO = &NewsletterDTO{
				ID:          cronJob.Edges.Newsletter.ID,
				Name:        cronJob.Edges.Newsletter.Name,
				Description: cronJob.Edges.Newsletter.Description,
			}
		}

		cronJobDTO := CronJobDTO{
			ID:         cronJob.ID,
			Name:       cronJob.Name,
			Time:       cronJob.Time,
			Newsletter: newsletterDTO,
			Scrapers:   scrapers,
		}
		cronJobDTOs = append(cronJobDTOs, cronJobDTO)
	}

	c.JSON(http.StatusOK, cronJobDTOs)
}

func getCronJob(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	client := getClient()
	defer client.Close()

	cronJob, err := client.CronJob.Query().
		Where(cronjob.IDEQ(id)).
		WithNewsletter().
		WithScrapers(func(q *ent.ScraperQuery) {
			q.WithSchema()
		}).
		Only(c.Request.Context())

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "CronJob not found"})
		return
	}

	c.JSON(http.StatusOK, cronJob)
}

func updateCronJob(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var input struct {
		Name         string `json:"name"`
		Time         string `json:"time"`
		NewsletterID *int   `json:"newsletter_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client := getClient()
	defer client.Close()

	update := client.CronJob.UpdateOneID(id)
	if input.Name != "" {
		update.SetName(input.Name)
	}
	if input.Time != "" {
		update.SetTime(input.Time)
	}
	if input.NewsletterID != nil {
		newsletter, err := client.Newsletter.Get(c.Request.Context(), *input.NewsletterID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Newsletter not found"})
			return
		}
		update.SetNewsletter(newsletter)
	}

	cronJob, err := update.Save(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, cronJob)
}

func deleteCronJob(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	client := getClient()
	defer client.Close()

	err = client.CronJob.DeleteOneID(id).Exec(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "CronJob deleted"})
}

// ===== USERS =====

func createUser(c *gin.Context) {
	var input struct {
		Email        string `json:"email" binding:"required,email"`
		NewsletterID int    `json:"newsletter_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client := getClient()
	defer client.Close()

	newsletter, err := client.Newsletter.Get(c.Request.Context(), input.NewsletterID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Newsletter not found"})
		return
	}

	user, err := client.User.Create().
		SetEmail(input.Email).
		SetNewsletter(newsletter).
		Save(c.Request.Context())

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, user)
}

func getUsersAPI(c *gin.Context) {
	client := getClient()
	defer client.Close()

	users, err := client.User.Query().
		WithNewsletter().
		All(c.Request.Context())

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convertir en DTOs
	var userDTOs []UserDTO
	for _, user := range users {
		var newsletterDTO *NewsletterDTO
		if user.Edges.Newsletter != nil {
			newsletterDTO = &NewsletterDTO{
				ID:          user.Edges.Newsletter.ID,
				Name:        user.Edges.Newsletter.Name,
				Description: user.Edges.Newsletter.Description,
			}
		}

		userDTO := UserDTO{
			ID:         user.ID,
			Email:      user.Email,
			Newsletter: newsletterDTO,
		}
		userDTOs = append(userDTOs, userDTO)
	}

	c.JSON(http.StatusOK, userDTOs)
}

func getUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	client := getClient()
	defer client.Close()

	user, err := client.User.Query().
		Where(user.IDEQ(id)).
		WithNewsletter().
		Only(c.Request.Context())

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func updateUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var input struct {
		Email        string `json:"email"`
		NewsletterID *int   `json:"newsletter_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client := getClient()
	defer client.Close()

	update := client.User.UpdateOneID(id)
	if input.Email != "" {
		update.SetEmail(input.Email)
	}
	if input.NewsletterID != nil {
		newsletter, err := client.Newsletter.Get(c.Request.Context(), *input.NewsletterID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Newsletter not found"})
			return
		}
		update.SetNewsletter(newsletter)
	}

	user, err := update.Save(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}

func deleteUserAPI(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	client := getClient()
	defer client.Close()

	err = client.User.DeleteOneID(id).Exec(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted"})
}

// ===== RELATIONS =====

func addScrapersToCronJob(c *gin.Context) {
	cronJobID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid CronJob ID"})
		return
	}

	var input struct {
		ScraperIDs []int `json:"scraper_ids" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client := getClient()
	defer client.Close()

	scrapers, err := client.Scraper.Query().
		Where(scraper.IDIn(input.ScraperIDs...)).
		All(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "One or more scrapers not found"})
		return
	}

	_, err = client.CronJob.UpdateOneID(cronJobID).
		AddScrapers(scrapers...).
		Save(c.Request.Context())

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Scrapers added to CronJob"})
}

func removeScraperFromCronJob(c *gin.Context) {
	cronJobID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid CronJob ID"})
		return
	}

	scraperID, err := strconv.Atoi(c.Param("scraperId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Scraper ID"})
		return
	}

	client := getClient()
	defer client.Close()

	scraper, err := client.Scraper.Get(c.Request.Context(), scraperID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Scraper not found"})
		return
	}

	_, err = client.CronJob.UpdateOneID(cronJobID).
		RemoveScrapers(scraper).
		Save(c.Request.Context())

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Scraper removed from CronJob"})
}

func addUsersToNewsletter(c *gin.Context) {
	newsletterID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Newsletter ID"})
		return
	}

	var input struct {
		UserIDs []int `json:"user_ids" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client := getClient()
	defer client.Close()

	users, err := client.User.Query().
		Where(user.IDIn(input.UserIDs...)).
		All(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "One or more users not found"})
		return
	}

	_, err = client.Newsletter.UpdateOneID(newsletterID).
		AddUsers(users...).
		Save(c.Request.Context())

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Users added to Newsletter"})
}

func removeUserFromNewsletter(c *gin.Context) {
	newsletterID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Newsletter ID"})
		return
	}

	userID, err := strconv.Atoi(c.Param("userId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid User ID"})
		return
	}

	client := getClient()
	defer client.Close()

	user, err := client.User.Get(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User not found"})
		return
	}

	_, err = client.Newsletter.UpdateOneID(newsletterID).
		RemoveUsers(user).
		Save(c.Request.Context())

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User removed from Newsletter"})
}

// ===== UTILS =====

func getClient() *ent.Client {
	client, err := ent.Open("sqlite3", "file:test.db?_fk=1")
	if err != nil {
		panic(err)
	}
	return client
}

func startCronHandler(c *gin.Context) {
	go startCron()
	c.JSON(http.StatusOK, gin.H{"message": "Cron jobs started"})
}

func seedHandler(c *gin.Context) {
	go func() {
		seedData()
	}()
	c.JSON(http.StatusOK, gin.H{"message": "Seed started"})
}

func clearHandler(c *gin.Context) {
	go func() {
		clearData()
	}()
	c.JSON(http.StatusOK, gin.H{"message": "Clear started"})
}

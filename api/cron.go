package main

import (
	"context"
	"fmt"
	"sync"
	"tidy/ent/scraper"
	"time"

	"github.com/robfig/cron/v3"
)
type CronTask struct {
	ID          int
	Name        string
	Time        string
	ScraperID   int
	ScraperName string
	Status      string // "running", "stopped", "error"
	LastRun     *time.Time
	NextRun     *time.Time
	EntryID     cron.EntryID
}
type CronManager struct {
	cron    *cron.Cron
	tasks   map[int]*CronTask
	mutex   sync.RWMutex
}

var cronManager *CronManager

// NewCronManager crée un nouveau gestionnaire de tâches cron
func NewCronManager() *CronManager {
	return &CronManager{
		cron:  cron.New(),
		tasks: make(map[int]*CronTask),
	}
}

// AddTask ajoute une nouvelle tâche cron
func (cm *CronManager) AddTask(task *CronTask) error {
	cm.mutex.Lock()
	defer cm.mutex.Unlock()

	// Créer une fonction pour exécuter le scraper
	scraperFunc := func() {
		cm.updateTaskStatus(task.ID, "running")
		now := time.Now()
		task.LastRun = &now
		
		fmt.Printf("🕒 Exécution de la tâche '%s' pour le scraper '%s' à %s\n", 
			task.Name, task.ScraperName, now.Format("2006-01-02 15:04:05"))
		
		// Exécuter le scraper
		executeScraperByID(task.ScraperID)
		
		// Mettre à jour le statut après exécution
		cm.updateTaskStatus(task.ID, "completed")
	}

	// Ajouter la tâche au cron
	entryID, err := cm.cron.AddFunc(task.Time, scraperFunc)
	if err != nil {
		return fmt.Errorf("erreur lors de l'ajout de la tâche cron: %v", err)
	}

	task.EntryID = entryID
	task.Status = "stopped"
	cm.tasks[task.ID] = task

	fmt.Printf("✅ Tâche '%s' ajoutée avec succès (ID: %d, EntryID: %d)\n", task.Name, task.ID, entryID)
	return nil
}

// RemoveTask supprime une tâche cron
func (cm *CronManager) RemoveTask(taskID int) error {
	cm.mutex.Lock()
	defer cm.mutex.Unlock()

	task, exists := cm.tasks[taskID]
	if !exists {
		return fmt.Errorf("tâche avec l'ID %d non trouvée", taskID)
	}

	cm.cron.Remove(task.EntryID)
	delete(cm.tasks, taskID)
	
	fmt.Printf("🗑️ Tâche '%s' supprimée (ID: %d)\n", task.Name, taskID)
	return nil
}

// GetTasks retourne toutes les tâches cron
func (cm *CronManager) GetTasks() []*CronTask {
	cm.mutex.RLock()
	defer cm.mutex.RUnlock()

	tasks := make([]*CronTask, 0, len(cm.tasks))
	for _, task := range cm.tasks {
		// Mettre à jour la prochaine exécution
		if entry := cm.cron.Entry(task.EntryID); entry.ID != 0 {
			next := entry.Next
			task.NextRun = &next
		}
		tasks = append(tasks, task)
	}
	return tasks
}

// GetTask retourne une tâche spécifique
func (cm *CronManager) GetTask(taskID int) (*CronTask, error) {
	cm.mutex.RLock()
	defer cm.mutex.RUnlock()

	task, exists := cm.tasks[taskID]
	if !exists {
		return nil, fmt.Errorf("tâche avec l'ID %d non trouvée", taskID)
	}

	// Mettre à jour la prochaine exécution
	if entry := cm.cron.Entry(task.EntryID); entry.ID != 0 {
		next := entry.Next
		task.NextRun = &next
	}

	return task, nil
}

// updateTaskStatus met à jour le statut d'une tâche
func (cm *CronManager) updateTaskStatus(taskID int, status string) {
	cm.mutex.Lock()
	defer cm.mutex.Unlock()

	if task, exists := cm.tasks[taskID]; exists {
		task.Status = status
	}
}

// Start démarre le gestionnaire de tâches cron
func (cm *CronManager) Start() {
	cm.cron.Start()
	fmt.Println("🚀 Gestionnaire de tâches cron démarré")
}

// Stop arrête le gestionnaire de tâches cron
func (cm *CronManager) Stop() {
	cm.cron.Stop()
	fmt.Println("⏹️ Gestionnaire de tâches cron arrêté")
}

// executeScraperByID exécute un scraper spécifique par son ID
func executeScraperByID(scraperID int) {
	client := getClient()
	defer client.Close()

	ctx := context.Background()
	scraper, err := client.Scraper.Query().
		Where(scraper.IDEQ(scraperID)).
		WithSchema(). // si tu as besoin du schema
		Only(ctx)
	if err != nil {
		fmt.Printf("❌ Erreur lors de la récupération du scraper %d: %v\n", scraperID, err)
		return
	}

	personalScraper(scraper)
}

func startCron() {
	// Initialiser le gestionnaire de tâches
	cronManager = NewCronManager()
 
	// Récupérer les tâches depuis la base de données
	jobs := getCronJobs()
 
	// Ajouter chaque tâche au gestionnaire
	for _, job := range jobs {
		fmt.Printf("📋 Configuration de la tâche: %s\n", job.Name)
		
		scrapers := job.Edges.Scrapers
		for _, scraper := range scrapers {
			// Créer une tâche pour chaque scraper
			task := &CronTask{
				ID:          job.ID, // Utiliser l'ID du job comme base
				Name:        fmt.Sprintf("%s - %s", job.Name, scraper.Name),
				Time:        job.Time,
				ScraperID:   scraper.ID,
				ScraperName: scraper.Name,
				Status:      "stopped",
			}

			// Ajouter la tâche au gestionnaire
			if err := cronManager.AddTask(task); err != nil {
				fmt.Printf("❌ Erreur lors de l'ajout de la tâche '%s': %v\n", task.Name, err)
			} else {
				fmt.Printf("✅ Tâche '%s' configurée pour le scraper '%s' à %s\n", 
					task.Name, scraper.Name, job.Time)
			}
		}
	}

	// Démarrer le gestionnaire
	cronManager.Start()
}

// Fonctions d'API pour le frontend

// GetCronTasksAPI retourne toutes les tâches cron pour l'API
func GetCronTasksAPI() []map[string]interface{} {
	if cronManager == nil {
		return []map[string]interface{}{}
	}

	tasks := cronManager.GetTasks()
	result := make([]map[string]interface{}, len(tasks))

	for i, task := range tasks {
		result[i] = map[string]interface{}{
			"id":           task.ID,
			"name":         task.Name,
			"time":         task.Time,
			"scraper_id":   task.ScraperID,
			"scraper_name": task.ScraperName,
			"status":       task.Status,
			"last_run":     task.LastRun,
			"next_run":     task.NextRun,
			"entry_id":     task.EntryID,
		}
	}

	return result
	}

func GetCronTaskAPI(taskID int) (map[string]interface{}, error) {
	if cronManager == nil {
		return nil, fmt.Errorf("gestionnaire de tâches non initialisé")
	}

	task, err := cronManager.GetTask(taskID)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"id":           task.ID,
		"name":         task.Name,
		"time":         task.Time,
		"scraper_id":   task.ScraperID,
		"scraper_name": task.ScraperName,
		"status":       task.Status,
		"last_run":     task.LastRun,
		"next_run":     task.NextRun,
		"entry_id":     task.EntryID,
	}, nil
}

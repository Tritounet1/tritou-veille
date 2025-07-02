package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// Scraper holds the schema definition for the Scraper entity.
type Scraper struct {
	ent.Schema
}

// Fields of the Scraper.
func (Scraper) Fields() []ent.Field {
	return []ent.Field{
		field.String("name").NotEmpty(),
		field.String("link").NotEmpty(),
		field.Bool("premium"),
	}
}

// Edges of the Scraper.
func (Scraper) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("schema", ScraperSchema.Type).
			Unique().
			Required(),
		edge.From("cronjobs", CronJob.Type).
			Ref("scrapers"),
	}
}
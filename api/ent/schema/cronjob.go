package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// CronJob holds the schema definition for the CronJob entity.
type CronJob struct {
	ent.Schema
}

// Fields of the CronJob.
func (CronJob) Fields() []ent.Field {
	return []ent.Field{
		field.String("name").NotEmpty(),
		field.String("time").NotEmpty(), // "@every 00h00m00s"
	}
}

// Edges of the CronJob.
func (CronJob) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("scrapers", Scraper.Type),
		edge.From("newsletter", Newsletter.Type).
			Ref("cronjobs").
			Unique().
			Required(),
	}
}

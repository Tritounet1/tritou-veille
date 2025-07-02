package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/field"
)

// ScraperSchema holds the schema definition for the ScraperSchema entity.
type ScraperSchema struct {
	ent.Schema
}

// Fields of the ScraperSchema.
func (ScraperSchema) Fields() []ent.Field {
	return []ent.Field{
		field.String("container").NotEmpty(),
		field.String("title").NotEmpty(),
		field.String("description").NotEmpty(),
		field.String("image").NotEmpty(),
		field.String("time").NotEmpty(),
		field.String("link").NotEmpty(),
	}
}

// Edges of the ScraperSchema.
func (ScraperSchema) Edges() []ent.Edge {
	return nil
}
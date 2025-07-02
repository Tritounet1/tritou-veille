package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// Newsletter holds the schema definition for the Newsletter entity.
type Newsletter struct {
	ent.Schema
}

// Fields of the Newsletter.
func (Newsletter) Fields() []ent.Field {
	return []ent.Field{
		field.String("name").NotEmpty(),
		field.String("description").NotEmpty(),
	}
}

// Edges of the Newsletter.
func (Newsletter) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("cronjobs", CronJob.Type),
		edge.To("users", User.Type),
	}
}
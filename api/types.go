package main

type scrapingSchema struct {
	container string
	title string
	description string
	image string
	time string
	link string
}
type scraper struct {
	name string
	link string
	premium bool
	schema scrapingSchema
}

type cronJob struct {
    name string
    time  string
	scraper scraper
}
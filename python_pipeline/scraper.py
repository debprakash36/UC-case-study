"""
Scraper Module for Urban Company Case Study
Collects customer feedback, reviews, and service listings.
Supports live scraping (with requests & BeautifulSoup) and mock dataset generation.
"""

import json
import logging
import os
import random
import time
from typing import Dict, List, Optional
import requests
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")


class UCScraper:
    def __init__(self, output_dir: str = "data/raw"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )
        }

    def fetch_url(self, url: str) -> Optional[str]:
        try:
            logging.info(f"Fetching URL: {url}")
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            return response.text
        except Exception as e:
            logging.error(f"Failed to fetch {url}: {e}")
            return None

    def parse_service_catalog(self, html_content: str) -> List[Dict]:
        """Parse service titles and pricing from HTML."""
        soup = BeautifulSoup(html_content, "html.parser")
        items = []
        # Generic selector example adaptable to specific DOM structure
        for card in soup.find_all("div", class_="service-card"):
            title = card.find("h3")
            price = card.find("span", class_="price")
            if title:
                items.append({
                    "title": title.get_text(strip=True),
                    "price": price.get_text(strip=True) if price else "N/A"
                })
        return items

    def generate_synthetic_reviews(self, count: int = 50) -> List[Dict]:
        """Generates realistic synthetic data for development and testing."""
        services = ["AC Repair", "Bathroom Deep Cleaning", "Salon at Home", "Plumbing", "Carpentry", "Appliance Repair"]
        sentiments = ["Positive", "Negative", "Neutral"]
        
        positive_templates = [
            "Great experience with {service}. The professional was on time and very skilled.",
            "Loved the {service}! Neat, hygienic, and very polite technician.",
            "Flawless booking and execution for {service}. Highly recommend Urban Company.",
            "Superb job done on {service}. Fixed the issue quickly and cleaned up afterwards."
        ]
        
        negative_templates = [
            "Terrible experience with {service}. Professional arrived 1 hour late without tools.",
            "Overcharged for {service} without prior estimate. Very disappointed.",
            "Poor quality work on {service}. The issue reoccurred the very next day.",
            "Customer support took forever to handle my complaint regarding {service}."
        ]
        
        neutral_templates = [
            "{service} was okay, standard job done but nothing extraordinary.",
            "Average experience with {service}. Timings were slightly pushed back.",
            "Did the job for {service}, but rates seem a bit higher compared to local market."
        ]

        data = []
        for i in range(1, count + 1):
            sent = random.choices(sentiments, weights=[0.45, 0.35, 0.20])[0]
            service = random.choice(services)
            
            if sent == "Positive":
                template = random.choice(positive_templates)
                rating = random.choice([4, 5])
            elif sent == "Negative":
                template = random.choice(negative_templates)
                rating = random.choice([1, 2])
            else:
                template = random.choice(neutral_templates)
                rating = 3
                
            data.append({
                "id": f"SCRAPED-{i:04d}",
                "service": service,
                "rating": rating,
                "text": template.format(service=service),
                "timestamp": int(time.time()) - random.randint(1000, 500000)
            })

        output_file = os.path.join(self.output_dir, "scraped_reviews.json")
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
            
        logging.info(f"Generated {count} records saved to {output_file}")
        return data


if __name__ == "__main__":
    scraper = UCScraper()
    scraper.generate_synthetic_reviews(count=20)

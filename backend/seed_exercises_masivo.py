import json
from database import SessionLocal
import models

db = SessionLocal()
with open("diofanto_ejercicios.json", encoding="utf-8") as f:
    ejercicios = json.load(f)

inserted, skipped = 0, 0
for ex in ejercicios:
    exists = db.query(models.Exercise).filter(models.Exercise.statement == ex["statement"]).first()
    if exists:
        skipped += 1
        continue
    db.add(models.Exercise(**ex))
    inserted += 1

db.commit()
print(f"Insertados: {inserted}, saltados (ya existían): {skipped}")
db.close()
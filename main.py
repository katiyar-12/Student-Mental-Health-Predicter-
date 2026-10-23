import joblib 
from fastapi import FastAPI 
from pathlib import Path
from pydantic import BaseModel  , Field 
from typing import Literal 
import pandas as pd 
from fastapi.middleware.cors import CORSMiddleware 
from fastapi.staticfiles import StaticFiles

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
      CORSMiddleware , 
      allow_origins=['*'] , 
      allow_methods=['*'] , 
      allow_headers=['*'] , 
)

class StudentData(BaseModel) : 
        Age : int = Field(... , le=100 , gt=10)
        Gender : Literal['Male' , 'Female']
        grouped_country : Literal['Other', 'India','USA',  'Canada','Australia','UK','Germany','Mexico','Turkey','France','Spain']
        Academic_Level : Literal['Undergraduate' , 'Graduate' , 'High School']

        Most_Used_Platform : Literal['Facebook', 'LinkedIn', 'Instagram', 'Snapchat', 'Twitter',
       'YouTube', 'TikTok', 'LINE', 'KakaoTalk', 'VKontakte', 'WhatsApp',
       'WeChat']
        
        Purpose_Of_Use : Literal['Networking', 'Education', 'Entertainment', 'News'] 
        Avg_Daily_Usage_Hours : float = Field(... , lt=24 , gt=0) 
        Daily_Unlocks : int = Field(... , gt=0 )
        Study_Hours : float = Field(...  , gt=0 , lt=24 )
        Physical_Activity_Hours : float = Field(... , gt=0 , lt=24) 
        Sleep_Hours_Per_Night : float = Field(... , gt=0 , lt=24)
        Stress_Level : Literal['Medium', 'Low', 'Very High', 'High']


class PredictionResponse(BaseModel) : 
      predicted_mental_health_score : float 


# Load the model using the script's directory

model = joblib.load('mental_health_model.pkl')
print(type(model))

@app.get("/")
def greet():
    return {"message": "Welcome to the Mental Health Prediction API"}

top_countries = ['Other', 'India','USA',  'Canada','Australia','UK','Germany','Mexico','Turkey','France','Spain']

@app.post('/predict') 
def predict(data : StudentData ) :
    #   country_group = data.Country if data.Country in top_countries else  'Other' 
      input_row = pd.DataFrame([{
            'Age' : data.Age ,
            'Gender' : data.Gender ,
            'grouped_Country' : data.grouped_country , 
            'Academic_Level' : data.Academic_Level ,
            'Most_Used_Platform' : data.Most_Used_Platform ,
            'Purpose_Of_Use' : data.Purpose_Of_Use ,
            'Avg_Daily_Usage_Hours' : data.Avg_Daily_Usage_Hours ,
            'Daily_Unlocks' : data.Daily_Unlocks ,
            'Study_Hours' : data.Study_Hours ,
            'Physical_Activity_Hours' : data.Physical_Activity_Hours ,
            'Sleep_Hours_Per_Night' : data.Sleep_Hours_Per_Night ,
            'Stress_Level' : data.Stress_Level  , 
      }])

      prediction = model.predict(input_row)[0]

      return PredictionResponse(predicted_mental_health_score=round(float(prediction) , 2))


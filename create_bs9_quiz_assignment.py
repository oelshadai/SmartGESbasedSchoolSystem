#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import random
import json
from datetime import datetime

def create_bs9_quiz():
    """Create BS9 Business Studies quiz assignment"""
    
    # Quiz questions pool
    questions = [
        {
            "question": "What is the primary purpose of market research?",
            "options": ["To increase sales", "To understand customer needs", "To reduce costs", "To hire employees"],
            "correct": 1,
            "topic": "Marketing"
        },
        {
            "question": "Which of the following is NOT a factor of production?",
            "options": ["Land", "Labor", "Capital", "Profit"],
            "correct": 3,
            "topic": "Economics"
        },
        {
            "question": "What does SWOT analysis stand for?",
            "options": ["Sales, Work, Operations, Technology", "Strengths, Weaknesses, Opportunities, Threats", "Systems, Workflow, Objectives, Targets", "Strategy, Work, Organization, Time"],
            "correct": 1,
            "topic": "Strategic Planning"
        },
        {
            "question": "What is the break-even point?",
            "options": ["Maximum profit point", "Point where revenue equals costs", "Minimum sales target", "Maximum production capacity"],
            "correct": 1,
            "topic": "Finance"
        },
        {
            "question": "Which leadership style involves shared decision-making?",
            "options": ["Autocratic", "Democratic", "Laissez-faire", "Bureaucratic"],
            "correct": 1,
            "topic": "Management"
        },
        {
            "question": "What is the main purpose of a business plan?",
            "options": ["To get loans", "To guide business operations", "To impress investors", "To comply with regulations"],
            "correct": 1,
            "topic": "Planning"
        },
        {
            "question": "Which is an example of external recruitment?",
            "options": ["Promoting existing staff", "Job advertisements", "Internal transfers", "Staff recommendations"],
            "correct": 1,
            "topic": "Human Resources"
        },
        {
            "question": "What does ROI stand for?",
            "options": ["Rate of Interest", "Return on Investment", "Risk of Investment", "Revenue over Income"],
            "correct": 1,
            "topic": "Finance"
        },
        {
            "question": "Which is NOT a method of market segmentation?",
            "options": ["Geographic", "Demographic", "Psychographic", "Economic"],
            "correct": 3,
            "topic": "Marketing"
        },
        {
            "question": "What is the main advantage of franchising?",
            "options": ["Complete control", "Proven business model", "No fees required", "Unlimited creativity"],
            "correct": 1,
            "topic": "Business Models"
        }
    ]
    
    # Select random questions for the quiz
    selected_questions = random.sample(questions, min(5, len(questions)))
    
    # Create quiz structure
    quiz_data = {
        "title": "BS9 Business Studies Quiz",
        "subject": "Business Studies",
        "level": "BS9",
        "duration": "30 minutes",
        "total_marks": len(selected_questions) * 2,
        "instructions": [
            "Read each question carefully",
            "Select the best answer from the options provided",
            "Each question carries 2 marks",
            "No negative marking"
        ],
        "questions": []
    }
    
    # Format questions
    for i, q in enumerate(selected_questions, 1):
        formatted_question = {
            "number": i,
            "question": q["question"],
            "options": {
                "A": q["options"][0],
                "B": q["options"][1],
                "C": q["options"][2],
                "D": q["options"][3]
            },
            "correct_answer": chr(65 + q["correct"]),  # Convert to A, B, C, D
            "topic": q["topic"],
            "marks": 2
        }
        quiz_data["questions"].append(formatted_question)
    
    return quiz_data

def save_quiz_files(quiz_data):
    """Save quiz in multiple formats"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Save as JSON
    json_filename = f"bs9_quiz_{timestamp}.json"
    with open(json_filename, 'w', encoding='utf-8') as f:
        json.dump(quiz_data, f, indent=2, ensure_ascii=False)
    
    # Save as text file for easy reading
    txt_filename = f"bs9_quiz_{timestamp}.txt"
    with open(txt_filename, 'w', encoding='utf-8') as f:
        f.write(f"{quiz_data['title']}\n")
        f.write("=" * len(quiz_data['title']) + "\n\n")
        f.write(f"Subject: {quiz_data['subject']}\n")
        f.write(f"Level: {quiz_data['level']}\n")
        f.write(f"Duration: {quiz_data['duration']}\n")
        f.write(f"Total Marks: {quiz_data['total_marks']}\n\n")
        
        f.write("Instructions:\n")
        for instruction in quiz_data['instructions']:
            f.write(f"- {instruction}\n")
        f.write("\n")
        
        f.write("Questions:\n")
        f.write("-" * 50 + "\n\n")
        
        for q in quiz_data['questions']:
            f.write(f"Q{q['number']}. {q['question']} ({q['marks']} marks)\n")
            f.write(f"Topic: {q['topic']}\n\n")
            for option_key, option_text in q['options'].items():
                f.write(f"   {option_key}) {option_text}\n")
            f.write(f"\nCorrect Answer: {q['correct_answer']}\n")
            f.write("-" * 50 + "\n\n")
    
    return json_filename, txt_filename

def main():
    """Main function to create and save quiz"""
    print("Creating BS9 Business Studies Quiz Assignment...")
    
    try:
        # Generate quiz
        quiz = create_bs9_quiz()
        
        # Save files
        json_file, txt_file = save_quiz_files(quiz)
        
        print(f"\nQuiz created successfully!")
        print(f"Files saved:")
        print(f"- JSON format: {json_file}")
        print(f"- Text format: {txt_file}")
        print(f"\nQuiz Details:")
        print(f"- Questions: {len(quiz['questions'])}")
        print(f"- Total Marks: {quiz['total_marks']}")
        print(f"- Duration: {quiz['duration']}")
        
    except Exception as e:
        print(f"Error creating quiz: {e}")

if __name__ == "__main__":
    main()
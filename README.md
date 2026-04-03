# Empowered Care - Multi-Agent Disease Outbreak Detection System

## Overview

Empowered Care is an intelligent multi-agent AI system for early disease outbreak detection. Built on FastAPI with Google Gemini AI, it processes outbreak reports through specialized agents to provide accurate risk assessment and actionable alerts.

## Architecture

The system implements a 5-agent pipeline as designed:

```
[Input Text]
   ↓
[Agent 1: Extractor] → Structured Data
   ↓
[Agent 2: Validator] → Validation Check
   ↓
[Agent 3: Risk Analyzer] → Risk Assessment
   ↓
[Agent 4: Alert Generator] → Human-Readable Alert
   ↓
[Human Validation] → Safety Layer
   ↓
[Alert System]
   ↓
[Agent 5: Data Assistant] → Query Responses
```

## Agents

### 1. Extraction Agent
- **Role**: Converts messy text reports into structured JSON
- **Input**: Raw text like "Fever, vomiting, 4 people, Jimma"
- **Output**: Structured `OutbreakReport` with location, symptoms, cases, etc.

### 2. Validation Agent
- **Role**: Checks data reasonableness and completeness
- **Features**: Rule-based + AI validation
- **Output**: `ValidationResult` with confidence score and issues

### 3. Risk Analysis Agent
- **Role**: Predicts outbreak risk and identifies possible diseases
- **Output**: `RiskAnalysis` with risk level (HIGH/MEDIUM/LOW) and reasoning

### 4. Alert Generation Agent
- **Role**: Creates clear, actionable alert messages
- **Output**: `AlertMessage` with title, message, and recommendations

### 5. Data Assistant Agent
- **Role**: Answers queries about outbreak data
- **Features**: Natural language queries, data summaries

## API Endpoints

### Outbreak Processing
```
POST /outbreak/process
- Body: { "text": "outbreak report text" }
- Returns: Full multi-agent processing result
```

### Human Validation
```
POST /outbreak/approve/{session_id}
- Body: { "approved": true/false }
- Approves or rejects generated alerts
```

### Data Queries
```
POST /outbreak/query
- Body: { "query": "natural language query" }
- Returns: AI-powered response with data insights
```

### Summary
```
GET /outbreak/summary
- Returns: Overview of processed reports
```

## Installation

1. **Environment Setup**
   ```bash
   # Activate virtual environment
   source myenv/bin/activate

   # Install dependencies
   pip install -r requirements.txt
   ```

2. **Environment Variables**
   - Ensure `.env` file contains `GEMINI_API_KEY`
   - API key should have access to Google Gemini models

3. **Run the Application**
   ```bash
   python main.py
   ```
   Server starts on `http://0.0.0.0:8000`

## Usage Examples

### Process Outbreak Report
```bash
curl -X POST "http://localhost:8000/outbreak/process" \
  -H "Content-Type: application/json" \
  -d '{"text": "Fever, vomiting, 4 people affected in Jimma"}'
```

### Query Data
```bash
curl -X POST "http://localhost:8000/outbreak/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the high-risk areas?"}'
```

## Data Flow

1. **Input Reception**: Raw text reports via API
2. **Multi-Agent Processing**: Sequential agent execution
3. **Human Validation**: Critical alerts require approval
4. **Alert Distribution**: Approved alerts sent to notification systems
5. **Data Storage**: Reports stored for analysis and queries

## Safety Features

- **Human Validation Layer**: All HIGH/MEDIUM risk alerts require human approval
- **Fallback Mechanisms**: Graceful degradation if AI services fail
- **Data Validation**: Multiple validation layers prevent false positives
- **Audit Trail**: Session IDs track all processing steps

## Technology Stack

- **Backend**: FastAPI (Python)
- **AI Engine**: Google Gemini 1.5 Flash/Pro
- **Data Validation**: Pydantic
- **OCR/Document Processing**: PaddleOCR, DocLayout-YOLO
- **Image Processing**: OpenCV, Pillow

## Development Status

✅ **Completed Implementation**
- Multi-agent architecture implemented
- All 5 agents functional
- API endpoints working
- Human validation system
- Data assistant queries
- Error handling and fallbacks

## Future Enhancements

- Real-time alert distribution system
- Advanced data analytics dashboard
- Integration with health monitoring systems
- Multi-language support
- Historical trend analysis

## License

This implementation is based on the Empowered Care design specification for disease outbreak detection.
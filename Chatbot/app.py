import os
import io
import base64
import logging
import tempfile
from datetime import datetime
from PIL import Image
from flask import Flask, request, jsonify, render_template, send_file
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
import google.generativeai as genai

from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors

# ---------------------------------------------------------
# Load environment variables & configure logging
# ---------------------------------------------------------
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------
# Flask App Setup
# ---------------------------------------------------------
template_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")
app = Flask(__name__, template_folder=template_path)
CORS(app)

# ---------------------------------------------------------
# Gemini API Configuration
# ---------------------------------------------------------
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY") or "YOUR_FALLBACK_KEY"
if not GEMINI_API_KEY:
    logger.warning("⚠ No Gemini API key found. Set GOOGLE_API_KEY or GEMINI_API_KEY env variable.")
else:
    genai.configure(api_key=GEMINI_API_KEY)

model = genai.GenerativeModel("gemini-1.5-flash")

# ---------------------------------------------------------
# File Upload Config
# ---------------------------------------------------------
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024  # 5MB max
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

# ---------------------------------------------------------
# --- MEDICAL ANALYSIS FUNCTIONS ---
# ---------------------------------------------------------
def get_medical_prompt(analysis_type, patient_info="", custom_prompt=""):
    """Generate structured prompt for Gemini medical image analysis"""
    base_disclaimer = (
        "IMPORTANT DISCLAIMER: This analysis is for educational purposes only "
        "and should not replace professional medical advice.\n\n"
    )
    prompts = {
        "general_medical": "Provide a general medical assessment of this image...",
        "diagnostic": "Perform a diagnostic analysis of this image...",
        "radiological": "Interpret this image from a radiological perspective...",
        "pathological": "Examine this image for pathological features...",
        "anatomical": "Analyze the anatomical aspects of this image..."
    }
    base_prompt = prompts.get(analysis_type, prompts["general_medical"])
    full_prompt = base_disclaimer + base_prompt
    if patient_info.strip():
        full_prompt += f"\n\nPatient Information: {patient_info}"
    if custom_prompt.strip():
        full_prompt += f"\n\nSpecific Analysis Requirements: {custom_prompt}"
    return full_prompt

def process_image_with_gemini(image_data, prompt):
    """Process image with Gemini"""
    image = Image.open(io.BytesIO(image_data))
    response = model.generate_content([prompt, image])
    return response.text

def create_pdf_report(report_text, image_data, analysis_type, patient_info=""):
    """Create PDF report with ReportLab"""
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    temp_file.close()
    doc = SimpleDocTemplate(temp_file.name, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    # Title
    title_style = ParagraphStyle("CustomTitle", parent=styles["Title"], fontSize=18, alignment=1)
    story.append(Paragraph("MEDICAL IMAGE ANALYSIS REPORT", title_style))
    story.append(Spacer(1, 12))

    story.append(Paragraph(f"<b>Date:</b> {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", styles["Normal"]))
    story.append(Paragraph(f"<b>Analysis Type:</b> {analysis_type.replace('_', ' ').title()}", styles["Normal"]))
    if patient_info.strip():
        story.append(Paragraph(f"<b>Patient Information:</b> {patient_info}", styles["Normal"]))
    story.append(Spacer(1, 20))

    # Image
    try:
        img = Image.open(io.BytesIO(image_data))
        img_temp = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
        img.save(img_temp.name, "PNG")
        img_temp.close()
        story.append(RLImage(img_temp.name, width=4 * inch, height=3 * inch))
        story.append(Spacer(1, 20))
        os.unlink(img_temp.name)
    except Exception as e:
        logger.warning(f"Could not add image to PDF: {e}")

    story.append(Paragraph("Medical Analysis:", styles["Heading2"]))
    for para in report_text.split("\n\n"):
        if para.strip():
            story.append(Paragraph(para, styles["Normal"]))
            story.append(Spacer(1, 12))

    doc.build(story)
    return temp_file.name

# ---------------------------------------------------------
# --- CHATBOT STATE ---
# ---------------------------------------------------------
conversations = {}

# ---------------------------------------------------------
# ROUTES
# ---------------------------------------------------------
@app.route("/")
def home():
    """Serve the chatbot UI"""
    return render_template("chatbot/bot.html")

@app.route("/chat", methods=["POST", "GET"])
def chat():
    if request.method == "GET":
        return jsonify({"message": "Chat endpoint is live."})

    data = request.get_json()
    user_message = data.get("message", "").strip()
    user_id = data.get("user_id", "default")

    if user_id not in conversations:
        conversations[user_id] = []

    conversations[user_id].append({"role": "user", "content": user_message})

    prompt = """
    You are a friendly mental health support assistant.
    Follow these rules:
    - Ask MCQs first (3–4 options + 'Other')
    - Narrow down step by step
    - Give empathetic advice
    - Suggest professional help if needed
    - Never prescribe medication
    """
    chat_input = prompt + "\n\nConversation so far:\n"
    for msg in conversations[user_id]:
        chat_input += f"{msg['role'].capitalize()}: {msg['content']}\n"

    response = model.generate_content(chat_input)
    reply_text = response.text.strip()

    options = []
    for line in reply_text.split("\n"):
        if line.strip() and (line[0].isdigit() or line.startswith("-") or line.startswith("•")):
            options.append(line.strip(" -•0123456789.").strip())

    conversations[user_id].append({"role": "assistant", "content": reply_text})

    return jsonify({"reply": reply_text, "options": options})

@app.route("/generate-medical-report", methods=["POST"])
def generate_medical_report():
    """Generate medical analysis text"""
    if "image" not in request.files:
        return jsonify({"success": False, "error": "No image provided"}), 400

    file = request.files["image"]
    if not allowed_file(file.filename):
        return jsonify({"success": False, "error": "Invalid file type"}), 400

    image_data = file.read()
    analysis_type = request.form.get("analysis_type", "general_medical")
    patient_info = request.form.get("patient_info", "")
    custom_prompt = request.form.get("custom_prompt", "")

    prompt = get_medical_prompt(analysis_type, patient_info, custom_prompt)
    report = process_image_with_gemini(image_data, prompt)

    return jsonify({"success": True, "report": report})

@app.route("/download-pdf-report", methods=["POST"])
def download_pdf_report():
    """Download report as PDF"""
    if "image" not in request.files:
        return jsonify({"success": False, "error": "No image provided"}), 400

    file = request.files["image"]
    image_data = file.read()
    analysis_type = request.form.get("analysis_type", "general_medical")
    patient_info = request.form.get("patient_info", "")
    custom_prompt = request.form.get("custom_prompt", "")

    prompt = get_medical_prompt(analysis_type, patient_info, custom_prompt)
    report = process_image_with_gemini(image_data, prompt)

    pdf_file_path = create_pdf_report(report, image_data, analysis_type, patient_info)
    return send_file(pdf_file_path, as_attachment=True, download_name="medical_report.pdf")

# ---------------------------------------------------------
# ENTRY POINT
# ---------------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True, port=4000)

from flask import Flask, request, jsonify, render_template_string, send_file
import google.generativeai as genai
import os
from PIL import Image
import io
import base64
import logging
from werkzeug.utils import secure_filename
from reportlab.lib.pagesizes import A4, letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from datetime import datetime
import tempfile
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB max file size
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

# Configure Gemini API
# Option 1: Set your API key as an environment variable: GOOGLE_API_KEY or GEMINI_API_KEY
# Option 2: Uncomment the line below and replace with your actual API key
# GEMINI_API_KEY = "your-actual-api-key-here"

# Try both environment variable names
GEMINI_API_KEY = os.getenv('GOOGLE_API_KEY') or os.getenv('GEMINI_API_KEY')

if not GEMINI_API_KEY:
    logger.warning("API key not found. Set GOOGLE_API_KEY or GEMINI_API_KEY environment variable")
else:
    genai.configure(api_key=GEMINI_API_KEY)

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_medical_prompt(analysis_type, patient_info="", custom_prompt=""):
    """Generate medical analysis prompts based on analysis type"""
    base_disclaimer = "IMPORTANT DISCLAIMER: This analysis is for educational and informational purposes only and should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult qualified healthcare professionals for medical concerns.\n\n"
    
    prompts = {
        'general_medical': """Provide a general medical assessment of this image. Include:
        - Overall visual observations related to health
        - Any visible anatomical structures or features
        - Potential areas of medical interest
        - General health-related observations
        - Recommendations for further evaluation if needed""",
        
        'diagnostic': """Perform a diagnostic analysis of this medical image. Include:
        - Systematic examination approach
        - Observable findings and their significance
        - Potential differential diagnoses (educational)
        - Key diagnostic features identified
        - Suggested follow-up or additional studies""",
        
        'radiological': """Interpret this image from a radiological perspective. Include:
        - Image quality and technical adequacy
        - Anatomical structures visible
        - Normal vs abnormal findings
        - Radiological patterns or signs
        - Clinical correlation recommendations""",
        
        'pathological': """Examine this image for pathological features. Include:
        - Morphological characteristics
        - Tissue or cellular patterns observed
        - Pathological changes if visible
        - Classification of findings
        - Clinical significance of observations""",
        
        'anatomical': """Analyze the anatomical aspects of this image. Include:
        - Anatomical structures identification
        - Spatial relationships and positioning
        - Anatomical variations if present
        - Structural integrity assessment
        - Educational anatomical insights"""
    }
    
    base_prompt = prompts.get(analysis_type, prompts['general_medical'])
    
    full_prompt = base_disclaimer + base_prompt
    
    if patient_info.strip():
        full_prompt += f"\n\nPatient Information: {patient_info}"
    
    if custom_prompt.strip():
        full_prompt += f"\n\nSpecific Analysis Requirements: {custom_prompt}"
    
    full_prompt += "\n\nPlease provide a structured, professional medical analysis while emphasizing that this is for educational purposes only."
    
    return full_prompt

def process_image_with_gemini(image_data, prompt):
    """Process image using Gemini Flash API"""
    try:
        # Initialize the model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Convert image data to PIL Image
        image = Image.open(io.BytesIO(image_data))
        
        # Generate content
        response = model.generate_content([prompt, image])
        
        return response.text
    
    except Exception as e:
        logger.error(f"Error processing image with Gemini: {str(e)}")
        raise e

def create_pdf_report(report_text, image_data, analysis_type, patient_info=""):
    """Create a PDF report with the medical analysis"""
    # Create a temporary file for the PDF
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    temp_file.close()
    
    try:
        # Create PDF document
        doc = SimpleDocTemplate(temp_file.name, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Title'],
            fontSize=18,
            spaceAfter=30,
            textColor=colors.darkblue,
            alignment=1  # Center alignment
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            textColor=colors.darkblue
        )
        
        disclaimer_style = ParagraphStyle(
            'Disclaimer',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.red,
            backColor=colors.lightgrey,
            borderWidth=1,
            borderColor=colors.red,
            leftIndent=10,
            rightIndent=10,
            spaceAfter=20
        )
        
        # Title
        story.append(Paragraph("MEDICAL IMAGE ANALYSIS REPORT", title_style))
        story.append(Spacer(1, 12))
        
        # Report metadata
        story.append(Paragraph(f"<b>Date:</b> {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", styles['Normal']))
        story.append(Paragraph(f"<b>Analysis Type:</b> {analysis_type.replace('_', ' ').title()}", styles['Normal']))
        if patient_info.strip():
            story.append(Paragraph(f"<b>Patient Information:</b> {patient_info}", styles['Normal']))
        story.append(Spacer(1, 20))
        
        # Disclaimer
        disclaimer_text = """
        <b>MEDICAL DISCLAIMER:</b> This analysis is generated by AI for educational and informational purposes only. 
        It should not be used as a substitute for professional medical advice, diagnosis, or treatment. 
        Always seek the advice of qualified healthcare professionals regarding any medical condition or treatment.
        """
        story.append(Paragraph(disclaimer_text, disclaimer_style))
        
        # Image (if small enough)
        img_temp_path = None
        try:
            img = Image.open(io.BytesIO(image_data))
            # Resize image to fit in PDF
            max_width, max_height = 4*inch, 3*inch
            img_width, img_height = img.size
            
            if img_width > max_width or img_height > max_height:
                ratio = min(max_width/img_width, max_height/img_height)
                new_width = int(img_width * ratio)
                new_height = int(img_height * ratio)
                img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Save resized image to temp file
            img_temp = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
            img.save(img_temp.name, 'PNG')
            img_temp.close()
            img_temp_path = img_temp.name
            
            # Add image to PDF
            story.append(Paragraph("Analyzed Image:", heading_style))
            story.append(RLImage(img_temp_path, width=img.width, height=img.height))
            story.append(Spacer(1, 20))
            
        except Exception as e:
            logger.warning(f"Could not add image to PDF: {str(e)}")
        
        # Analysis Report
        story.append(Paragraph("Medical Analysis:", heading_style))
        
        # Split report into paragraphs for better formatting
        paragraphs = report_text.split('\n\n')
        for para in paragraphs:
            if para.strip():
                story.append(Paragraph(para.strip(), styles['Normal']))
                story.append(Spacer(1, 12))
        
        # Footer
        story.append(Spacer(1, 30))
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=1
        )
        story.append(Paragraph("Generated by AI Medical Image Analysis System", footer_style))
        story.append(Paragraph("For Educational Purposes Only", footer_style))
        
        # Build PDF
        doc.build(story)
        
        # Clean up temp image file
        if img_temp_path and os.path.exists(img_temp_path):
            try:
                os.unlink(img_temp_path)
            except Exception as e:
                logger.warning(f"Could not delete temp image file: {str(e)}")
        
        return temp_file.name
        
    except Exception as e:
        # Clean up on error
        if os.path.exists(temp_file.name):
            try:
                os.unlink(temp_file.name)
            except:
                pass
        raise e

@app.route('/')
def index():
    """Serve the main HTML page"""
    # Read the HTML content from the artifact
    with open('index.html', 'r', encoding='utf-8') as f:
        html_content = f.read()
    return html_content

@app.route('/generate-medical-report', methods=['POST'])
def generate_medical_report():
    """Generate medical analysis report from uploaded image"""
    try:
        # Check if API key is configured
        if not GEMINI_API_KEY:
            return jsonify({
                'success': False,
                'error': 'Gemini API key not configured. Please set GEMINI_API_KEY environment variable.'
            }), 500

        # Check if image file is present
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No image file provided'
            }), 400

        file = request.files['image']
        
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400

        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': 'Invalid file type. Please upload JPG, PNG, GIF, or WEBP files only.'
            }), 400

        # Get form data
        analysis_type = request.form.get('analysis_type', 'general_medical')
        patient_info = request.form.get('patient_info', '')
        custom_prompt = request.form.get('custom_prompt', '')

        # Read image data
        image_data = file.read()
        
        # Validate image size
        if len(image_data) > app.config['MAX_CONTENT_LENGTH']:
            return jsonify({
                'success': False,
                'error': 'File size too large. Maximum size is 5MB.'
            }), 400

        # Generate medical prompt
        prompt = get_medical_prompt(analysis_type, patient_info, custom_prompt)
        
        logger.info(f"Processing medical image: {file.filename}, Analysis Type: {analysis_type}")

        # Process with Gemini
        report = process_image_with_gemini(image_data, prompt)
        
        return jsonify({
            'success': True,
            'report': report,
            'analysis_type': analysis_type
        })

    except Exception as e:
        logger.error(f"Error in generate_medical_report: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'An error occurred while processing your request: {str(e)}'
        }), 500

@app.route('/download-pdf-report', methods=['POST'])
def download_pdf_report():
    """Generate and download PDF medical report"""
    try:
        # Check if API key is configured
        if not GEMINI_API_KEY:
            return jsonify({
                'success': False,
                'error': 'Gemini API key not configured.'
            }), 500

        # Check if image file is present
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No image file provided'
            }), 400

        file = request.files['image']
        
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': 'Invalid file type.'
            }), 400

        # Get form data
        analysis_type = request.form.get('analysis_type', 'general_medical')
        patient_info = request.form.get('patient_info', '')
        custom_prompt = request.form.get('custom_prompt', '')

        # Read image data
        image_data = file.read()
        
        # Generate medical prompt
        prompt = get_medical_prompt(analysis_type, patient_info, custom_prompt)
        
        logger.info(f"Generating PDF for medical image: {file.filename}")

        # Process with Gemini
        report = process_image_with_gemini(image_data, prompt)
        
        # Create PDF
        pdf_file_path = create_pdf_report(report, image_data, analysis_type, patient_info)
        
        # Return PDF file
        def remove_file(response):
            try:
                os.unlink(pdf_file_path)
            except Exception as e:
                logger.warning(f"Could not delete PDF file: {str(e)}")
            return response
        
        return send_file(
            pdf_file_path,
            as_attachment=True,
            download_name=f'medical_analysis_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf',
            mimetype='application/pdf'
        )

    except Exception as e:
        logger.error(f"Error in download_pdf_report: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'An error occurred while generating PDF: {str(e)}'
        }), 500

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'gemini_api_configured': bool(GEMINI_API_KEY)
    })

@app.errorhandler(413)
def too_large(e):
    """Handle file too large error"""
    return jsonify({
        'success': False,
        'error': 'File size too large. Maximum size is 5MB.'
    }), 413

@app.errorhandler(500)
def internal_error(e):
    """Handle internal server errors"""
    return jsonify({
        'success': False,
        'error': 'Internal server error occurred.'
    }), 500

if __name__ == '__main__':
    # Check if running in development
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    port = int(os.getenv('PORT', 5000))
    
    print("=" * 50)
    print("🏥 MEDICAL IMAGE ANALYSIS SYSTEM")
    print("=" * 50)
    print(f"Server starting on port {port}")
    print(f"Debug mode: {debug_mode}")
    print(f"Gemini API configured: {'Yes' if GEMINI_API_KEY else 'No'}")
    print("=" * 50)
    
    if not GEMINI_API_KEY:
        print("⚠️  WARNING: GEMINI_API_KEY environment variable not set!")
        print("   Set it using: export GEMINI_API_KEY='your-api-key-here'")
        print("=" * 50)
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug_mode
    )
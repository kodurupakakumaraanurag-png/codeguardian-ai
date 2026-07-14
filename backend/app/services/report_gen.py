import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from typing import Dict, Any

class ReportGen:
    @staticmethod
    def generate_prediction_pdf(
        output_path: str,
        dataset_name: str,
        model_name: str,
        model_metrics: Dict[str, Any],
        input_data: Dict[str, Any],
        prediction_result: Dict[str, Any],
        shap_forces: Dict[str, float]
    ) -> str:
        """
        Generates a premium PDF report detailing software quality predictions and SHAP explainability.
        """
        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40
        )
        
        styles = getSampleStyleSheet()
        
        # Define Custom Color Palette (Premium Dark Theme/Brand Style)
        primary_color = colors.HexColor("#312e81") # Indigo 900
        secondary_color = colors.HexColor("#4338ca") # Indigo 700
        accent_color = colors.HexColor("#10b981") # Emerald 500 (Safe)
        danger_color = colors.HexColor("#ef4444") # Red 500 (Defect)
        text_dark = colors.HexColor("#1f2937") # Gray 800
        text_light = colors.HexColor("#6b7280") # Gray 500
        bg_light = colors.HexColor("#f9fafb") # Gray 50
        
        # Custom Typography Styles
        title_style = ParagraphStyle(
            "ReportTitle",
            parent=styles["Heading1"],
            fontSize=24,
            leading=28,
            textColor=primary_color,
            spaceAfter=15
        )
        
        section_style = ParagraphStyle(
            "SectionHeading",
            parent=styles["Heading2"],
            fontSize=16,
            leading=20,
            textColor=secondary_color,
            spaceBefore=15,
            spaceAfter=10,
            keepWithNext=True
        )
        
        body_style = ParagraphStyle(
            "ReportBody",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            textColor=text_dark,
            spaceAfter=8
        )
        
        meta_style = ParagraphStyle(
            "ReportMeta",
            parent=styles["Italic"],
            fontSize=9,
            leading=12,
            textColor=text_light,
            spaceAfter=10
        )

        story = []
        
        # 1. Header Section
        story.append(Paragraph("CodeGuardian AI", title_style))
        story.append(Paragraph("Software Quality Prediction Report", ParagraphStyle("SubTitle", parent=title_style, fontSize=14, textColor=text_light)))
        story.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", meta_style))
        story.append(Spacer(1, 10))
        
        # 2. Prediction Summary Banner
        pred_label = prediction_result.get("prediction", 0)
        probability = prediction_result.get("probability")
        
        pred_text = "DEFECT DETECTED" if pred_label == 1 else "SAFE / NO DEFECTS"
        banner_bg = danger_color if pred_label == 1 else accent_color
        
        prob_text = f" (Confidence: {probability*100:.1f}%)" if probability is not None else ""
        
        banner_data = [[Paragraph(f"<b>Prediction Result:</b> {pred_text}{prob_text}", ParagraphStyle("Banner", parent=body_style, fontSize=12, textColor=colors.white))]]
        banner_table = Table(banner_data, colWidths=[530])
        banner_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), banner_bg),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
            ('TOPPADDING', (0,0), (-1,-1), 10),
            ('LEFTPADDING', (0,0), (-1,-1), 15),
            ('RIGHTPADDING', (0,0), (-1,-1), 15),
        ]))
        story.append(banner_table)
        story.append(Spacer(1, 20))
        
        # 3. Model Information
        story.append(Paragraph("Model Information", section_style))
        model_meta_data = [
            ["Dataset Used:", dataset_name],
            ["Algorithm Trained:", model_name],
        ]
        
        # Add metrics
        for k, v in model_metrics.items():
            model_meta_data.append([f"Model {k.capitalize()}:", f"{v:.4f}" if isinstance(v, float) else str(v)])
            
        model_table = Table(model_meta_data, colWidths=[200, 330])
        model_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg_light),
            ('GRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
            ('PADDING', (0,0), (-1,-1), 6),
            ('TEXTCOLOR', (0,0), (-1,-1), text_dark),
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ]))
        story.append(model_table)
        story.append(Spacer(1, 20))
        
        # 4. Input Features Table
        story.append(Paragraph("Input Software Metrics", section_style))
        input_rows = [["Feature Metric", "Provided Value"]]
        for k, v in input_data.items():
            val_str = f"{v:.4f}" if isinstance(v, float) else str(v)
            input_rows.append([k, val_str])
            
        input_table = Table(input_rows, colWidths=[265, 265])
        input_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), primary_color),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, bg_light]),
            ('PADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(input_table)
        story.append(Spacer(1, 20))
        
        # 5. Explanations (SHAP Forces)
        story.append(Paragraph("SHAP Explainability Insights", section_style))
        story.append(Paragraph("SHAP (SHapley Additive exPlanations) attributes a value to each feature that represents how much that metric pushed the prediction away from the baseline average. Positive values increase defect risk; negative values decrease it.", body_style))
        
        shap_rows = [["Feature Metric", "SHAP Impact Score", "Influence Direction"]]
        
        # Sort SHAP values by absolute magnitude
        sorted_shap = sorted(shap_forces.items(), key=lambda x: abs(x[1]), reverse=True)
        for feat, score in sorted_shap:
            direction = "Increases Bug Risk (+)" if score > 0 else "Reduces Bug Risk (-)"
            row_color = danger_color if score > 0 else accent_color
            dir_paragraph = Paragraph(f"<font color='{row_color.hexval()}'><b>{direction}</b></font>", body_style)
            shap_rows.append([feat, f"{score:.4f}", dir_paragraph])
            
        shap_table = Table(shap_rows, colWidths=[200, 130, 200])
        shap_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), secondary_color),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('GRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, bg_light]),
            ('PADDING', (0,0), (-1,-1), 5),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(shap_table)
        
        # Build PDF
        doc.build(story)
        return output_path

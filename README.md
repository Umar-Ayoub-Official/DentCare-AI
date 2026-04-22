# DentCare AI: Automated Dental Pathologies Detection 🦷

DentCare AI is an advanced diagnostic assistant that leverages state-of-the-art Artificial Intelligence (**YOLOv8 & RT-DETR**) to detect dental issues such as **cavities, fillings, and impacted teeth** from both clinical photographs and X-ray (OPG) images. This system is designed to provide dentists with fast, accurate, and automated diagnostic support.

## 🛠️ Project Architecture & Methodology
The project utilizes a dual-pipeline approach to handle diverse dental data:
1. **Clinical Stream:** Employs **Instance Segmentation** for identifying visible dental pathologies.
2. **Radiograph (X-ray) Stream:** Utilizes specialized object detection for deep-seated issues in OPG images.

![Methodology Diagram](docs/methodology.png)
*Figure 1: Deep Learning Pipeline for Dental Medical Imaging*

## 📊 Results & Performance
We conducted extensive comparative analysis across various YOLOv8 variants and RT-DETR architectures to achieve optimal diagnostic accuracy.

### 1. Clinical Dataset (Instance Segmentation)
For clinical imagery, **YOLOv8l-seg (Large)** delivered the most robust performance:

| Model Architecture | Precision | Recall | mAP@50 |
| :--- | :--- | :--- | :--- |
| **YOLOv8l-seg (Large)** | **0.855** | **0.837** | **0.860** |
| YOLOv8m-seg | 0.724 | 0.708 | 0.735 |

![Clinical Results](docs/Clinical_results_table.png)

### 2. X-ray (OPG) Dataset (Detection)
For radiograph analysis, **YOLOv8n-OBB** (Oriented Bounding Boxes) proved to be the most efficient and accurate:

| Model | Precision (%) | Recall (%) | mAP@50 (%) |
| :--- | :--- | :--- | :--- |
| **YOLOv8n-OBB** | **94.6%** | **92.8%** | **95.2%** |
| RT-DETR | 91.2% | 88.5% | 91.5% |

![X-ray Results](docs/X_Ray_results_table.png)

## 📥 Trained Model Weights
Due to GitHub's file size limitations, the final trained models are hosted on Google Drive. You can download them below:

* 🚀 **[Download X-Ray Detection Model (YOLOv8-OBB)](https://drive.google.com/file/d/12a25ypjT82VXol_-w6CF_0Nkh2wzSjXt/view?usp=sharing)**
* 📸 **[Download Clinical Segmentation Model (YOLOv8l-seg)](https://drive.google.com/file/d/1Ya9aDH0DcMASPXLpBmxlGjBA-Ebb5Gma/view?usp=sharing)**

## 🚀 Key Features
- **Dual-Mode Detection:** Comprehensive support for both clinical and OPG (X-ray) images.
- **High Precision:** Achieved a top mAP of **95.2%** on X-ray datasets.
- **Real-time Inference:** Optimized for rapid processing in clinical environments.
- **Full-Stack Integration:** Complete system featuring a Flask/Django backend and a responsive user interface.

## 📂 Repository Structure
- `backend/`: API integration and model inference logic.
- `frontend/`: User interface and diagnostic dashboard.
- `models/`: Placeholder for weights (refer to download links above).
- `docs/`: Methodology diagrams and detailed performance metrics.
- `app.py`: Main application entry point.

---
**Developed by Umar Ayoub** *Final Year Project (AI Specialization) - University of Engineering and Technology (UET) Mardan*

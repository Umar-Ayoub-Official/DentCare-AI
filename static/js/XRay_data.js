document.addEventListener("DOMContentLoaded", () => {
    // Selectors
    const imageUpload = document.getElementById("imageUpload");
    const previewImg = document.getElementById("previewImg");
    const uploadIcon = document.getElementById("uploadIcon");
    const deleteBtn = document.getElementById("deleteBtn");
    const analyzeBtn = document.getElementById("analyzeBtn");
    const reportArea = document.getElementById("reportArea");
    const resultPlaceholder = document.getElementById("resultPlaceholder");
    const detectedResultImg = document.getElementById("detectedResultImg");
    const imgOverlay = document.getElementById("imgOverlay");
    
    // Actions & Full View
    const reportActions = document.getElementById("reportActions");
    const btnPDF = document.getElementById("btnPDF");
    const btnShare = document.getElementById("btnShare");
    const shareMenu = document.getElementById("shareMenu");
    const shareWA = document.getElementById("shareWA");
    const shareGmail = document.getElementById("shareGmail");
    const fullViewSection = document.getElementById("fullViewSection");
    const largeResultImg = document.getElementById("largeResultImg");

    // X-RAY SPECIFIC NOTES
    const xrayNotes = {
        "Cavity": "Tooth decay detected due to enamel damage.",
        "Impacted Tooth": "Tooth is stuck in the gum and not properly erupted.",
        "Filling": "Existing dental filling detected in the tooth.",
        "Implant": "Artificial dental implant detected replacing a missing tooth."
    };

    function resetUI() {
        imageUpload.value = "";
        previewImg.src = "";
        previewImg.style.display = "none";
        uploadIcon.style.display = "block";
        deleteBtn.style.display = "none";
        detectedResultImg.style.display = "none";
        imgOverlay.style.display = "none";
        resultPlaceholder.style.display = "block";
        reportActions.style.display = "none";
        reportArea.innerHTML = '<p style="color: #576675; font-style: italic; padding: 10px;">No X-Ray analysis performed yet.</p>';
        if(fullViewSection) fullViewSection.style.display = "none";
    }

    // X-Ray Validation: X-Rays MUST be grayscale
    function isNotGrayscale(img) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width; canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(canvas.width/4, canvas.height/4, canvas.width/2, canvas.height/2).data;
        for (let i = 0; i < data.length; i += 40) {
            if (Math.abs(data[i] - data[i+1]) > 30 || Math.abs(data[i] - data[i+2]) > 30) return true; // It has color
        }
        return false; 
    }

    imageUpload.addEventListener("change", function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = function() {
                    if (isNotGrayscale(img)) {
                        alert("⚠️ INVALID IMAGE: This looks like a Clinical Photo. Please upload a valid Grayscale X-Ray (OPG/Periapical).");
                        resetUI();
                        return;
                    }
                    previewImg.src = e.target.result;
                    previewImg.style.display = "block";
                    uploadIcon.style.display = "none";
                    deleteBtn.style.display = "block";
                };
            };
            reader.readAsDataURL(file);
        }
    });

    deleteBtn.addEventListener("click", resetUI);

    analyzeBtn.addEventListener("click", async () => {
        if(!imageUpload.files[0]) return alert("Please upload an X-Ray first!");
        analyzeBtn.innerHTML = "Processing X-Ray...";

        const formData = new FormData();
        formData.append('image', imageUpload.files[0]);
        formData.append('type', 'xray'); // Targeted to X-Ray model

        try {
            const response = await fetch('/api/predict', { method: 'POST', body: formData });
            const data = await response.json();

            // Validation: If it's a random methodology or non-dental grayscale pic
            if (!data.detections || data.detections.length === 0) {
                alert("⚠️ QUALITY WARNING: No dental features found in this X-Ray. Please upload a clear radiographic scan.");
                resetUI();
                return;
            }

            resultPlaceholder.style.display = "none";
            detectedResultImg.src = `data:image/jpeg;base64,${data.image}`;
            detectedResultImg.style.display = "block";
            imgOverlay.style.display = "flex";
            reportActions.style.display = "flex";

            let tagsHTML = data.detections.map(d => `<span class="tag">${d.toUpperCase()}</span>`).join(' ');
            let listHTML = "";
            data.detections.forEach(det => {
                for (let key in xrayNotes) {
                    if (det.toLowerCase().includes(key.toLowerCase())) {
                        listHTML += `<li><strong>${key}:</strong> ${xrayNotes[key]}</li>`;
                    }
                }
            });

            reportArea.innerHTML = `
                <div id="pdfTarget" style="text-align: left; padding: 10px;">
                    <p><strong>Status:</strong> <span style="color:#e74c3c; font-weight:bold;">Radiographic Finding Found</span></p>
                    <p><strong>Detected:</strong> ${tagsHTML}</p>
                    <p style="margin-top:10px; border-bottom:1px solid #ddd; font-weight:bold;">Detailed Findings</p>
                    <p>The AI model analyzed the X-Ray image and identified that:</p>
                    <ul style="padding-left:0; margin-top:5px;">${listHTML}</ul>
                    <p style="margin-top:10px; border-bottom:1px solid #ddd; font-weight:bold;">Clinical Advice</p>
                    <p>The patient should consult a dental specialist to discuss these radiographic findings.</p>
                    <p style="font-size:0.7rem; color:#888; margin-top:10px;">📝 Note: Radiographic AI analysis. Diagnosis must be verified by a radiologist or dentist.</p>
                </div>`;

            const msg = encodeURIComponent(`DentCare AI X-Ray Report: Findings: ${data.detections.join(", ")}`);
            shareWA.href = `https://wa.me/?text=${msg}`;
            shareGmail.href = `mailto:?subject=X-Ray Diagnostic Report&body=${msg}`;

        } catch (e) {
            alert("Connection error!");
        } finally {
            analyzeBtn.innerHTML = "Analyse X-Ray";
        }
    });

    btnFullView.addEventListener("click", () => {
        largeResultImg.src = detectedResultImg.src;
        fullViewSection.style.display = "block";
        fullViewSection.scrollIntoView({ behavior: "smooth" });
    });

    btnPDF.addEventListener("click", () => {
        const content = document.getElementById('pdfTarget').innerHTML;
        const pdfContent = `<div style="padding:20px; font-family:sans-serif;"><h1 style="color:#0088cc;">DentCare AI X-Ray Report</h1><hr>${content}</div>`;
        html2pdf().from(pdfContent).set({ margin: 10, filename: 'DentCare_XRay_Report.pdf', jsPDF: { unit: 'mm', format: 'a4' } }).save();
    });

    btnShare.addEventListener("click", (e) => {
        e.stopPropagation();
        shareMenu.style.display = shareMenu.style.display === "none" ? "block" : "none";
    });

    document.addEventListener("click", () => { shareMenu.style.display = "none"; });

    document.getElementById("btnSave").addEventListener("click", () => {
        const link = document.createElement("a");
        link.href = detectedResultImg.src;
        link.download = "XRay_Analysis.jpg";
        link.click();
    });
});
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

    const findingsNotes = {
        "Abrasion": "Tooth surface wear detected due to friction or brushing.",
        "Filling": "Existing dental filling detected in the tooth.",
        "Crown": "Dental crown detected covering and protecting the tooth.",
        "Caries": "Tooth decay detected due to bacterial damage."
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
        reportArea.innerHTML = '<p style="color: #576675; font-style: italic; padding: 10px;">No analysis performed yet.</p>';
        if(fullViewSection) fullViewSection.style.display = "none";
    }

    function isGrayscale(img) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width; canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(canvas.width/4, canvas.height/4, canvas.width/2, canvas.height/2).data;
        for (let i = 0; i < data.length; i += 40) {
            if (Math.abs(data[i] - data[i+1]) > 25 || Math.abs(data[i] - data[i+2]) > 25) return false;
        }
        return true; 
    }

    imageUpload.addEventListener("change", function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = function() {
                    if (isGrayscale(img)) {
                        alert("⚠️ INVALID IMAGE: X-Ray detected. Please upload a colorful Clinical Mouth Photo.");
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
        if(!imageUpload.files[0]) return alert("Please upload an image first!");
        analyzeBtn.innerHTML = "Processing...";

        const formData = new FormData();
        formData.append('image', imageUpload.files[0]);
        formData.append('type', 'clinical');

        try {
            const response = await fetch('/api/predict', { method: 'POST', body: formData });
            const data = await response.json();

            if (data.detections.length === 0) {
                alert("⚠️ QUALITY ALERT: No dental features detected. Ensure you are uploading a clear mouth photo.");
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
                for (let key in findingsNotes) {
                    if (det.toLowerCase().includes(key.toLowerCase())) {
                        listHTML += `<li><strong>${key}:</strong> ${findingsNotes[key]}</li>`;
                    }
                }
            });

            reportArea.innerHTML = `
                <div id="pdfTarget" style="text-align: left; padding: 10px;">
                    <p><strong>Status:</strong> <span style="color:#e74c3c; font-weight:bold;">Issue Found</span></p>
                    <p><strong>Detected:</strong> ${tagsHTML}</p>
                    <p style="margin-top:10px; border-bottom:1px solid #ddd;"><strong>Detailed Findings</strong></p>
                    <ul style="padding-left:0; margin-top:5px;">${listHTML}</ul>
                    <p style="margin-top:10px; border-bottom:1px solid #ddd;"><strong>Clinical Advice</strong></p>
                    <p>Early treatment avoids complications. Consult a dentist.</p>
                    <p style="font-size:0.7rem; color:#888; margin-top:10px;">📝 Note: AI-generated report. Verify with a professional.</p>
                </div>`;

            // Setup Share
            const msg = encodeURIComponent(`DentCare AI Report: Issues found: ${data.detections.join(", ")}`);
            shareWA.href = `https://wa.me/?text=${msg}`;
            shareGmail.href = `mailto:?subject=Dental Report&body=${msg}`;

        } catch (e) {
            alert("Connection error!");
        } finally {
            analyzeBtn.innerHTML = "Analyse Image";
        }
    });

    // Actions
    btnFullView.addEventListener("click", () => {
        largeResultImg.src = detectedResultImg.src;
        fullViewSection.style.display = "block";
        fullViewSection.scrollIntoView({ behavior: "smooth" });
    });

    btnPDF.addEventListener("click", () => {
        const content = document.getElementById('pdfTarget').innerHTML;
        const pdfContent = `<div style="padding:20px; font-family:sans-serif;"><h1 style="color:#0088cc;">DentCare AI Report</h1><hr>${content}</div>`;
        html2pdf().from(pdfContent).set({ margin: 10, filename: 'DentCare_Report.pdf', jsPDF: { unit: 'mm', format: 'a4' } }).save();
    });

    btnShare.addEventListener("click", (e) => {
        e.stopPropagation();
        shareMenu.style.display = shareMenu.style.display === "none" ? "block" : "none";
    });

    document.addEventListener("click", () => { shareMenu.style.display = "none"; });

    document.getElementById("btnSave").addEventListener("click", () => {
        const link = document.createElement("a");
        link.href = detectedResultImg.src;
        link.download = "Clinical_Analysis.jpg";
        link.click();
    });
});
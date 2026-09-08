import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

export async function exportElementToPdf(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Elemento #${elementId} não foi encontrado.`);
  }

  // Garante que todas as imagens no elemento estejam totalmente carregadas antes da captura
  const images = Array.from(element.getElementsByTagName("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalHeight !== 0) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        })
    )
  );

  const canvas = await html2canvas(element, {
    scale: 2, // Resolução 2x para impressão A4 nítida
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: "#ffffff",
    windowWidth: 1200,
    onclone: (clonedDoc) => {
      const clonedEl = clonedDoc.getElementById(elementId);
      if (clonedEl) {
        clonedEl.style.display = "block";
        clonedEl.style.visibility = "visible";
        clonedEl.style.position = "static";
        clonedEl.style.opacity = "1";
        clonedEl.style.transform = "none";

        let parent = clonedEl.parentElement;
        while (parent && parent.tagName !== "BODY") {
          parent.style.display = "block";
          parent.style.visibility = "visible";
          parent.style.position = "static";
          parent.style.opacity = "1";
          parent = parent.parentElement;
        }
      }
    },
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}


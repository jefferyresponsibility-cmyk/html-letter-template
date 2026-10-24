const form = document.querySelector("#letterForm");
const fields = Object.fromEntries(
  [...form.elements].filter((element) => element.name).map((element) => [element.name, element])
);

const initialValues = {};
for (const [name, field] of Object.entries(fields)) initialValues[name] = field.value;

const styles = ["Forest", "Ocean", "Burgundy", "Classic"];
let activeStyle = 0;

const preview = {
  company: document.querySelector("#previewCompany"),
  senderAddress: document.querySelector("#previewSenderAddress"),
  senderContact: document.querySelector("#previewSenderContact"),
  date: document.querySelector("#previewDate"),
  recipientName: document.querySelector("#previewRecipientName"),
  recipientRole: document.querySelector("#previewRecipientRole"),
  recipientAddress: document.querySelector("#previewRecipientAddress"),
  subject: document.querySelector("#previewSubject"),
  greeting: document.querySelector("#previewGreeting"),
  body: document.querySelector("#previewBody"),
  closing: document.querySelector("#previewClosing"),
  signerName: document.querySelector("#previewSignerName"),
  signerTitle: document.querySelector("#previewSignerTitle"),
  footerCompany: document.querySelector("#footerCompany")
};

function safeText(value) {
  return String(value ?? "").trim();
}

function formatDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "long", year: "numeric"
  }).format(date);
}

function updatePreview() {
  const value = (name) => safeText(fields[name].value);

  preview.company.textContent = value("company") || "YOUR ORGANIZATION";
  preview.senderAddress.textContent = value("senderAddress");
  const contact = [value("senderEmail")].filter(Boolean).join(" · ");
  preview.senderContact.textContent = contact;
  preview.date.textContent = formatDate(value("letterDate"));
  preview.recipientName.textContent = value("recipientName");
  preview.recipientRole.textContent = value("recipientRole");
  preview.recipientRole.hidden = !value("recipientRole");
  preview.recipientAddress.textContent = value("recipientAddress");
  preview.subject.textContent = value("subject");
  preview.greeting.textContent = value("greeting");
  preview.body.textContent = fields.bodyText.value;
  preview.closing.textContent = value("closing");
  preview.signerName.textContent = value("signerName");
  preview.signerTitle.textContent = value("signerTitle");
  preview.footerCompany.textContent = value("company") || "YOUR ORGANIZATION";
}

function applyTemplate(type) {
  const templates = {
    general: {
      subject: "Introduction and next steps",
      greeting: `Dear ${safeText(fields.recipientName.value) || "Recipient"},`,
      bodyText: "We are pleased to write to you regarding the matter stated above.\\n\\nPlease review the details in this letter and contact us if you have any questions. We appreciate your time and look forward to hearing from you.\\n\\nThis sample is for layout demonstration only. Replace it with accurate, authorized content before sending.",
      closing: "Yours sincerely,"
    },
    offer: {
      subject: "Employment Offer",
      greeting: `Dear ${safeText(fields.recipientName.value) || "Candidate"},`,
      bodyText: "We are pleased to offer you the position of [Job Title] with [Organization], subject to the terms and conditions set out in the final employment agreement.\\n\\nYour proposed start date is [Start Date]. Details regarding compensation, responsibilities, and other conditions should be reviewed in the accompanying agreement.\\n\\nPlease review the official offer and contact the authorized representative with any questions. This sample is not an actual offer of employment.",
      closing: "Yours sincerely,"
    },
    appointment: {
      subject: "Appointment Letter",
      greeting: `Dear ${safeText(fields.recipientName.value) || "Recipient"},`,
      bodyText: "We are writing to confirm your appointment as [Position] at [Organization], effective [Effective Date], subject to the terms in your official appointment documentation.\\n\\nPlease review the responsibilities, reporting arrangements, and applicable conditions stated in the approved documents. Contact the authorized representative if you need clarification.\\n\\nThis is a sample template and does not confirm an actual appointment.",
      closing: "Yours sincerely,"
    },
    admission: {
      subject: "Admission Letter",
      greeting: `Dear ${safeText(fields.recipientName.value) || "Applicant"},`,
      bodyText: "We are pleased to inform you that your application for [Programme / Course] has been considered. Please refer to your institution's official admission notice for the confirmed decision, programme details, requirements, and deadlines.\\n\\nFor clarification or next steps, contact the institution through its verified official channels.\\n\\nThis is a sample layout only and is not proof of admission.",
      closing: "Yours faithfully,"
    }
  };

  const selected = templates[type] || templates.general;
  for (const [name, content] of Object.entries(selected)) fields[name].value = content.replaceAll("\\\\n", "\n");
  updatePreview();
}

fields.letterDate.value = new Date().toLocaleDateString("en-CA");
form.addEventListener("input", updatePreview);
form.addEventListener("change", (event) => {
  if (event.target.name === "letterType") applyTemplate(event.target.value);
});
document.querySelector("#styleBtn").addEventListener("click", (event) => {
  activeStyle = (activeStyle + 1) % styles.length;
  const style = styles[activeStyle];
  document.body.dataset.theme = style.toLowerCase();
  event.currentTarget.textContent = `Style: ${style}`;
  event.currentTarget.title = `Current style: ${style}. Click to switch letter style.`;
  event.currentTarget.setAttribute("aria-label", `Change style. Current style: ${style}`);
});
document.querySelector("#printBtn").addEventListener("click", () => window.print());
document.querySelector("#downloadPdfBtn").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = "Generating PDF...";

  let captureHost;
  try {
    if (typeof window.html2canvas !== "function" || !window.jspdf?.jsPDF) {
      throw new Error("PDF tools could not load. Check your internet connection and try again.");
    }

    await document.fonts.ready;
    captureHost = document.createElement("div");
    Object.assign(captureHost.style, {
      position: "fixed",
      top: "0",
      left: "-10000px",
      width: "800px",
      zIndex: "-1"
    });

    const letter = document.querySelector("#letterPreview").cloneNode(true);
    Object.assign(letter.style, {
      width: "800px",
      minWidth: "800px",
      maxWidth: "none",
      height: "1120px",
      minHeight: "1120px",
      margin: "0",
      padding: "62px 70px 38px",
      boxShadow: "none"
    });
    captureHost.append(letter);
    document.body.append(captureHost);

    const canvas = await window.html2canvas(letter, {
      backgroundColor: null,
      scale: 2,
      width: 800,
      height: 1120,
      windowWidth: 1000,
      windowHeight: 1120
    });
    const pdf = new window.jspdf.jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);

    const filename = [fields.company.value, fields.subject.value]
      .map((part) => part.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, ""))
      .filter(Boolean)
      .join("-")
      .toLowerCase() || "letter";
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error("Could not generate the letter PDF.", error);
    window.alert(error instanceof Error ? error.message : "Could not generate the PDF. Please try again.");
  } finally {
    captureHost?.remove();
    button.disabled = false;
    button.textContent = originalLabel;
  }
});
document.querySelector("#resetBtn").addEventListener("click", () => {
  for (const [name, value] of Object.entries(initialValues)) fields[name].value = value;
  fields.letterDate.value = new Date().toLocaleDateString("en-CA");
  updatePreview();
});
updatePreview();

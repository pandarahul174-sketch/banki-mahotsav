import Swal from "sweetalert2";

const maroon = "#6b1228";
const danger = "#b42318";
const muted = "#6f675f";

const Modal = Swal.mixin({
  target: document.body,
  heightAuto: false,
  backdrop: "rgba(42, 18, 24, 0.55)",
  customClass: {
    container: "bm-swal",
    popup: "bm-swal-popup",
  },
});

export function swalToast(title, icon = "success") {
  return Swal.fire({
    toast: true,
    position: "top-end",
    icon,
    title,
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    target: document.body,
  });
}

export function swalSuccess(title, text) {
  return Modal.fire({
    icon: "success",
    title,
    text: text || undefined,
    timer: 1800,
    timerProgressBar: true,
    showConfirmButton: false,
  });
}

export function swalError(title, text) {
  return Modal.fire({
    icon: "error",
    title,
    text: text || "Something went wrong.",
    confirmButtonColor: maroon,
  });
}

export async function swalConfirm({
  title,
  text,
  confirmText = "Yes",
  icon = "warning",
  destructive = false,
}) {
  const result = await Modal.fire({
    icon,
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "Cancel",
    confirmButtonColor: destructive ? danger : maroon,
    cancelButtonColor: muted,
    reverseButtons: true,
    focusCancel: true,
  });
  return result.isConfirmed;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function swalImage(url, title) {
  const src = escapeHtml(url);
  const cap = title ? `<p class="bm-lightbox-cap">${escapeHtml(title)}</p>` : "";
  return Modal.fire({
    html: `<img class="bm-lightbox-img" src="${src}" alt="" />${cap}`,
    showConfirmButton: false,
    showCloseButton: true,
    width: "auto",
    padding: "1.4rem",
    customClass: {
      container: "bm-swal",
      popup: "bm-swal-popup bm-swal-image",
      htmlContainer: "bm-lightbox",
    },
  });
}

export async function swalPrompt(title, value = "https://") {
  const result = await Modal.fire({
    title,
    input: "url",
    inputValue: value,
    inputPlaceholder: "https://",
    showCancelButton: true,
    confirmButtonText: "Insert",
    confirmButtonColor: maroon,
    cancelButtonColor: muted,
  });
  return result.isConfirmed ? result.value : "";
}

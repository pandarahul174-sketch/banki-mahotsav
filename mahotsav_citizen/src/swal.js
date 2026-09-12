import Swal from "sweetalert2";

const orange = "#d35400";
const muted = "#5b534c";

const Modal = Swal.mixin({
  target: document.body,
  heightAuto: false,
  backdrop: "rgba(28, 25, 23, 0.48)",
  confirmButtonColor: orange,
  customClass: {
    container: "bm-swal",
    popup: "bm-swal-popup",
  },
});

export function swalSuccess(title, text) {
  return Modal.fire({
    icon: "success",
    title,
    text: text || undefined,
    confirmButtonText: "OK",
  });
}

export function swalError(title, text) {
  return Modal.fire({
    icon: "error",
    title,
    text: text || "Something went wrong.",
    confirmButtonColor: orange,
  });
}

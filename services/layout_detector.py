from doclayout_yolo import YOLOv10


class LayoutDetector:
    def __init__(self):
        self.model = YOLOv10("models/doclayout_yolo_ft.pt")

    def detect(self, image):
        # Increased imgsz to 1024 for higher precision on document layout
        results = self.model(image, imgsz=1024)
        boxes = []
        confidences = []
        labels = []
        
        # Get class names from model
        names = self.model.names
        
        for r in results:
            for box in r.boxes:
                boxes.append(box.xyxy[0].tolist())
                confidences.append(float(box.conf))
                labels.append(names[int(box.cls)])
        return boxes, confidences, labels
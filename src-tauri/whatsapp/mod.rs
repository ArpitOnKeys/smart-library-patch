use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use tauri::{Window, Emitter};
use tokio::time::{sleep, Duration};

#[derive(Debug, Serialize, Deserialize)]
pub struct BulkMessageRequest {
    pub students: Vec<StudentMessage>,
    pub message_template: String,
    pub attach_receipt: bool,
    pub interval_seconds: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StudentMessage {
    pub student_id: String,
    pub name: String,
    pub phone: String,
    pub receipt_path: Option<String>,
    pub personalization_tokens: HashMap<String, String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MessageProgress {
    pub student_id: String,
    pub name: String,
    pub phone: String,
    pub status: String,
    pub error: Option<String>,
    pub processed: usize,
    pub total: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WhatsAppSession {
    pub is_connected: bool,
    pub session_id: Option<String>,
    pub qr_code: Option<String>,
}

pub struct WhatsAppManager {
    session: Option<String>,
    is_connected: bool,
}

impl WhatsAppManager {
    pub fn new() -> Self {
        Self {
            session: None,
            is_connected: false,
        }
    }

    pub async fn initialize_session(&mut self, window: &Window) -> Result<WhatsAppSession, String> {
        // Simulate WhatsApp Web authentication
        // In a real implementation, this would use puppeteer or similar
        
        if self.is_connected {
            return Ok(WhatsAppSession {
                is_connected: true,
                session_id: self.session.clone(),
                qr_code: None,
            });
        }

        // Simulate QR code generation for first-time auth
        let qr_code = "https://web.whatsapp.com/qr/MOCK_QR_CODE".to_string();
        
        // Emit QR code to frontend
        window.emit("whatsapp-qr-code", &qr_code).map_err(|e| e.to_string())?;
        
        // Simulate waiting for QR scan (in real implementation, this would wait for actual scan)
        sleep(Duration::from_secs(3)).await;
        
        self.session = Some(uuid::Uuid::new_v4().to_string());
        self.is_connected = true;
        
        window.emit("whatsapp-connected", &()).map_err(|e| e.to_string())?;
        
        Ok(WhatsAppSession {
            is_connected: true,
            session_id: self.session.clone(),
            qr_code: None,
        })
    }

    pub async fn send_bulk_messages(
        &self,
        request: BulkMessageRequest,
        window: &Window,
    ) -> Result<(), String> {
        if !self.is_connected {
            return Err("WhatsApp session not connected".to_string());
        }

        let total = request.students.len();
        
        for (index, student) in request.students.iter().enumerate() {
            // Personalize message
            let mut personalized_message = request.message_template.clone();
            for (token, value) in &student.personalization_tokens {
                personalized_message = personalized_message.replace(&format!("{{{}}}", token), value);
            }

            // Simulate sending message
            let result = self.send_individual_message(
                &student.phone,
                &personalized_message,
                student.receipt_path.as_ref(),
            ).await;

            let progress = MessageProgress {
                student_id: student.student_id.clone(),
                name: student.name.clone(),
                phone: student.phone.clone(),
                status: if result.is_ok() { "sent".to_string() } else { "failed".to_string() },
                error: result.err(),
                processed: index + 1,
                total,
            };

            // Emit progress to frontend
            window.emit("whatsapp-message-progress", &progress).map_err(|e| e.to_string())?;

            // Wait between messages to avoid rate limiting
            if index < total - 1 {
                sleep(Duration::from_secs(request.interval_seconds)).await;
            }
        }

        window.emit("whatsapp-bulk-complete", &()).map_err(|e| e.to_string())?;
        Ok(())
    }

    async fn send_individual_message(
        &self,
        phone: &str,
        message: &str,
        receipt_path: Option<&String>,
    ) -> Result<(), String> {
        // Simulate message sending with 90% success rate
        sleep(Duration::from_millis(500)).await;
        
        if rand::random::<f64>() < 0.9 {
            Ok(())
        } else {
            Err("Failed to send message".to_string())
        }
    }

    pub fn disconnect(&mut self) {
        self.session = None;
        self.is_connected = false;
    }

    pub fn is_connected(&self) -> bool {
        self.is_connected
    }
}

// Mock random function since we can't use rand crate
mod rand {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    use std::time::{SystemTime, UNIX_EPOCH};

    pub fn random<T>() -> T 
    where 
        T: From<f64>
    {
        let mut hasher = DefaultHasher::new();
        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos();
        now.hash(&mut hasher);
        let hash = hasher.finish();
        T::from((hash as f64) / (u64::MAX as f64))
    }
}
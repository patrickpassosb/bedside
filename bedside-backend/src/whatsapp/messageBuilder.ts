interface Appointment {
  id: string;
  title: string;
  scheduled_time: string;
  location: string | null;
  preparation_notes: string | null;
}

interface Medication {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  route: string;
  reason: string;
}

export function buildScheduleListPayload(appointments: Appointment[]) {
  return {
    title: "Sua agenda de hoje",
    description: "Veja seus compromissos agendados para hoje. Toque em um item para mais detalhes.",
    buttonText: "Ver agenda",
    sections: [
      {
        title: "Compromissos de hoje",
        rows: appointments.map((apt) => ({
          rowId: `apt_${apt.id}`,
          title: `${apt.scheduled_time} - ${apt.title}`,
          description: apt.location ?? "Local a confirmar",
        })),
      },
    ],
  };
}

export function buildMedicationListPayload(medications: Medication[]) {
  return {
    title: "Seus medicamentos",
    description: "Veja seus medicamentos atuais. Toque em um item para mais detalhes.",
    buttonText: "Ver medicamentos",
    sections: [
      {
        title: "Medicamentos ativos",
        rows: medications.map((med) => ({
          rowId: `med_${med.id}`,
          title: `${med.medication_name} ${med.dosage}`,
          description: `${med.route} - ${med.frequency}`,
        })),
      },
    ],
  };
}

export function buildWelcomeButtonPayload(patientName: string, hospitalName: string, language: string) {
  const isEs = language.startsWith("es");
  const isEn = language.startsWith("en");

  const body = isEn
    ? `I'm Bedside, your care assistant at ${hospitalName}. I'm here to help you understand your treatment, medications, and schedule. How can I help?`
    : isEs
      ? `Soy Bedside, tu asistente de cuidado en ${hospitalName}. Estoy aqui para ayudarte a entender tu tratamiento, medicamentos y horario. ¿Como puedo ayudarte?`
      : `Eu sou o Bedside, seu assistente de cuidados no ${hospitalName}. Estou aqui para ajudar voce a entender seu tratamento, medicamentos e agenda. Como posso ajudar?`;

  const buttons = isEn
    ? [
        { buttonId: "schedule", buttonText: { displayText: "My schedule today" } },
        { buttonId: "medications", buttonText: { displayText: "My medications" } },
        { buttonId: "question", buttonText: { displayText: "I have a question" } },
      ]
    : isEs
      ? [
          { buttonId: "schedule", buttonText: { displayText: "Mi agenda de hoy" } },
          { buttonId: "medications", buttonText: { displayText: "Mis medicamentos" } },
          { buttonId: "question", buttonText: { displayText: "Tengo una pregunta" } },
        ]
      : [
          { buttonId: "schedule", buttonText: { displayText: "Minha agenda de hoje" } },
          { buttonId: "medications", buttonText: { displayText: "Meus medicamentos" } },
          { buttonId: "question", buttonText: { displayText: "Tenho uma duvida" } },
        ];

  return {
    title: `Ola ${patientName}!`,
    description: body,
    footer: isEn ? "Bedside - Patient Assistant" : isEs ? "Bedside - Asistente del Paciente" : "Bedside - Assistente do Paciente",
    buttons,
  };
}

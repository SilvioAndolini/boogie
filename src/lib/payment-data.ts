export interface PaymentData {
  TRANSFERENCIA_BANCARIA: {
    banco: string
    cuenta: string
    titular: string
    cedula: string
  }
  PAGO_MOVIL: {
    banco: string
    telefono: string
    cedula: string
  }
  ZELLE: {
    email: string
    nombre: string
  }
  EFECTIVO_FARMATODO: {
    instrucciones: string
  }
  USDT: {
    red: string
    direccion: string
  }
}

function getPaymentData(): PaymentData {
  return {
    TRANSFERENCIA_BANCARIA: {
      banco: process.env.PAYMENT_TRANSFERENCIA_BANCO || 'Banco de Venezuela',
      cuenta: process.env.PAYMENT_TRANSFERENCIA_CUENTA || 'XXXX-XXXX-XXXX-XXXX',
      titular: process.env.PAYMENT_TRANSFERENCIA_TITULAR || 'Boogie C.A.',
      cedula: process.env.PAYMENT_TRANSFERENCIA_CEDULA || 'J-XXXXXXXX',
    },
    PAGO_MOVIL: {
      banco: process.env.PAYMENT_PAGO_MOVIL_BANCO || 'Banco de Venezuela',
      telefono: process.env.PAYMENT_PAGO_MOVIL_TELEFONO || '0414-XXX-XXXX',
      cedula: process.env.PAYMENT_PAGO_MOVIL_CEDULA || 'J-XXXXXXXX',
    },
    ZELLE: {
      email: process.env.PAYMENT_ZELLE_EMAIL || 'pagos@boogie.app',
      nombre: process.env.PAYMENT_ZELLE_NOMBRE || 'Boogie CA',
    },
    EFECTIVO_FARMATODO: {
      instrucciones: process.env.PAYMENT_FARMATODO_INSTRUCCIONES || 'Realiza el pago en cualquier farmacia Farmatodo indicando el número de referencia que se te asignará al confirmar.',
    },
    USDT: {
      red: process.env.PAYMENT_USDT_RED || 'TRC-20 (Tron)',
      direccion: process.env.PAYMENT_USDT_DIRECCION || 'TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    },
  }
}

export async function getDatosPago(): Promise<PaymentData> {
  return getPaymentData()
}

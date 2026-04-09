export interface GuiaSeccion {
  id: string
  titulo: string
  icono: string
  contenido: GuiaContenido[]
}

export interface GuiaContenido {
  tipo: 'parrafo' | 'subtitulo' | 'lista-si' | 'lista-no' | 'lista' | 'cita' | 'destacado' | 'ejemplo'
  texto: string
  items?: string[]
}

export const GUIA_SECCIONES: GuiaSeccion[] = [
  {
    id: 'bienvenida',
    titulo: 'Bienvenida',
    icono: '👋',
    contenido: [
      {
        tipo: 'parrafo',
        texto: 'Si estás leyendo esto es porque tienes algo que mucha gente sueña con tener: un espacio que puedes convertir en ingresos, en libertad, en un plan que te eche pa\'lante. Tal vez tienes un apartamento que pasaba vacío, una habitación que nadie usaba, una casa en la playa que solo visitabas en Semana Santa, o hasta un espacio en el campo que tenía más polvo que vida.',
      },
      {
        tipo: 'parrafo',
        texto: 'Sea lo que sea, ahora puede ser tu boogie. Y no un boogie cualquiera, sino uno de esos que la gente recuerda, que recomienda, que vuelve a reservar.',
      },
      {
        tipo: 'destacado',
        texto: 'El éxito en los boogies no es para los que tienen más dinero ni para los que tienen la propiedad más lujosa. Es para los que le echan ganas, los que son pilas, los que entienden que detrás de cada reserva hay una persona que eligió tu espacio entre cientos de opciones.',
      },
      {
        tipo: 'parrafo',
        texto: 'Esta guía es el resultado de analizar a fondo cómo funciona el ecosistema de los boogies: los estándares de calidad que la plataforma exige, las señales que su algoritmo usa para decidir quién aparece primero en las búsquedas, las recomendaciones que los anfitriones exitosos comparten entre ellos, y las tendencias de marketing que en 2026 están marcando la diferencia.',
      },
      {
        tipo: 'parrafo',
        texto: 'No vas a encontrar aquí lenguaje técnico rebuscado ni teoría abstracta. Esto está escrito como si estuviéramos echando un cafecito y yo te estuviera contando todo lo que sé, con la verdad por delante y sin rodeos.',
      },
    ],
  },
  {
    id: 'calidad',
    titulo: 'Los Cimientos: La Calidad',
    icono: '🏗️',
    contenido: [
      {
        tipo: 'parrafo',
        texto: 'Antes de pensar en fotos bonitas, en precios competitivos o en marketing en redes sociales, hay algo que tiene que estar claro desde el principio: la calidad. Sin calidad, todo lo demás es una casa construida sobre arena.',
      },
      {
        tipo: 'destacado',
        texto: 'Los estándares de calidad no son sugerencias ni recomendaciones opcionales: son reglas. Si las cumples, la plataforma te premia con más visibilidad y mejores reseñas. Si las ignoras, te entierra en los resultados de búsqueda.',
      },
      {
        tipo: 'subtitulo',
        texto: 'Sé honesto: describe tu boogie exactamente como es',
      },
      {
        tipo: 'parrafo',
        texto: 'La primera regla de oro, la más importante de todas: sé honesto. La mentira tiene las patas cortas. Cada huésped que llega es un juez. Va a comparar lo que vio en el anuncio con lo que encuentra en la realidad, y si hay una diferencia significativa, lo primero que va a hacer es dejar una reseña mala.',
      },
      {
        tipo: 'cita',
        texto: 'Una reseña mala es como una mancha de aceite en una camisa blanca: se nota, se queda, y es increíblemente difícil de quitar.',
      },
      {
        tipo: 'subtitulo',
        texto: 'Las fotos: tu primera promesa',
      },
      {
        tipo: 'lista-si',
        texto: 'Lo que SÍ debes hacer con las fotos:',
        items: [
          'Invierte en calidad visual. Un celular moderno con buena cámara es suficiente. Buena iluminación natural es clave: abre las cortinas, prende las luces, que el espacio se vea vivo y acogedor.',
          'Muestra cada espacio importante: living, cocina, baño, habitaciones, vista, balcón, entrada. No dejes que el huésped se imagine nada.',
          'Incluye fotos de los detalles que hacen la diferencia: la cafetera especial, el kit de bienvenida, el rincón de lectura.',
          'Mantén las fotos actualizadas. Si pintaste las paredes o cambiaste los muebles, actualiza las fotos.',
        ],
      },
      {
        tipo: 'lista-no',
        texto: 'Lo que NUNCA debes hacer con las fotos:',
        items: [
          'Editarlas para esconder defectos. Si hay un problema, arréglalo. La transparencia siempre gana.',
          'Usar fotos de otro lugar. Si no está listo, no lo publiques.',
          'Tomar fotos con cosas personales expuestas: documentos, ropa, platos sucios.',
        ],
      },
      {
        tipo: 'subtitulo',
        texto: 'La descripción: tu palabra escrita',
      },
      {
        tipo: 'lista',
        texto: 'Elementos que NUNCA deben faltar en tu descripción:',
        items: [
          'Tipo de espacio: apartamento completo, habitación privada, estudio, casa entera. Sé específico.',
          'Capacidad real: cuántas personas pueden dormir cómodamente.',
          'Servicios y amenidades reales: wifi, aire acondicionado, artículos de primera necesidad.',
          'Características especiales o limitaciones: agua caliente que tarda, obras cercanas, ascensor.',
          'Políticas básicas: fumar, mascotas, horario de silencio, fiestas.',
        ],
      },
      {
        tipo: 'ejemplo',
        texto: '"Este apartamento es tu casa lejos de casa. Está en el corazón de la ciudad, a pasos de los mejores restaurantes. Tiene luz natural todo el día, una cocina equipada, y una cama tan cómoda que vas a querer quedarte una semana más. El wifi es rápido y estable. El barrio es tranquilo y seguro. No es un penthouse de lujo, pero está impecable y te va a encantar."',
      },
    ],
  },
  {
    id: 'limpieza',
    titulo: 'La Limpieza',
    icono: '✨',
    contenido: [
      {
        tipo: 'parrafo',
        texto: 'Si hay algo que puede destruir tu reputación más rápido que cualquier otra cosa, es la suciedad. No importa cuán bonito sea tu espacio: si un huésped encuentra pelo en la ducha, polvo en los muebles o manchas en las sábanas, olvídate de esa reseña de cinco estrellas.',
      },
      {
        tipo: 'subtitulo',
        texto: 'Protocolo de limpieza entre huéspedes',
      },
      {
        tipo: 'lista',
        texto: 'Habitaciones:',
        items: [
          'Cambiar toda la ropa de cama: sábanas, fundas, cobertor. Lávalas con detergente de calidad.',
          'Aspirar o trapear el piso, incluyendo debajo de la cama y esquinas.',
          'Limpiar mesas de noche, lámparas y superficies.',
          'Revisar cajones y armarios: retira objetos olvidados.',
        ],
      },
      {
        tipo: 'lista',
        texto: 'Baño:',
        items: [
          'Desinfectar el inodoro por dentro y por fuera, incluyendo la base.',
          'Limpiar el espejo sin dejar marcas.',
          'Fregar la ducha, paredes, cortina y desagüe. El pelo acumulado es una de las quejas más comunes.',
          'Reponer: papel higiénico (mínimo 2 rollos), jabón, champú, toallas limpias de buena calidad.',
        ],
      },
      {
        tipo: 'lista',
        texto: 'Cocina:',
        items: [
          'Lavar y secar platos, vasos y utensilios.',
          'Limpiar estufa, horno y microondas por dentro y por fuera.',
          'Limpiar el refrigerador: tirar comida del huésped anterior.',
          'Verificar básicos: sal, pimienta, aceite, café.',
        ],
      },
      {
        tipo: 'subtitulo',
        texto: 'Los detalles que distinguen al excelente',
      },
      {
        tipo: 'lista',
        texto: 'Lo que aparece en las mejores reseñas:',
        items: [
          'Un aroma agradable al llegar. Sutil, no perfumes sintéticos.',
          'Toallas dobladas con cuidado, estilo spa.',
          'La cama impecable: sábanas sin arrugas, almohadas mullidas.',
          'Un manual claro de instrucciones: A/C, cafetera, cerradura, controles.',
        ],
      },
      {
        tipo: 'destacado',
        texto: 'La limpieza no es un gasto, es una inversión. Considera contratar un servicio profesional, usar insumos de calidad y mantener un checklist de limpieza para asegurar consistencia.',
      },
    ],
  },
  {
    id: 'comunicacion',
    titulo: 'La Comunicación',
    icono: '💬',
    contenido: [
      {
        tipo: 'parrafo',
        texto: 'La comunicación es una de las columnas vertebrales de la experiencia. La plataforma mide tu tiempo de respuesta con precisión quirúrgica, y un mal desempeño puede afectar directamente tu visibilidad.',
      },
      {
        tipo: 'lista',
        texto: 'Tiempos de respuesta esperados:',
        items: [
          'Mensajes urgentes o huéspedes próximos: menos de 1 hora, idealmente minutos.',
          'Consultas antes de la reserva: responder rápido aumenta la probabilidad de reserva.',
          'Mensajes durante la estancia: lo más rápido posible. Un huésped sin respuesta se siente abandonado.',
        ],
      },
      {
        tipo: 'subtitulo',
        texto: 'Estrategias por etapa',
      },
      {
        tipo: 'lista',
        texto: 'Antes de la reserva:',
        items: [
          'Responde con claridad y amabilidad.',
          'Sé honesto si tu espacio no es ideal para su situación.',
          'Ofrece información proactiva sobre check-in y flexibilidad.',
        ],
      },
      {
        tipo: 'lista',
        texto: 'Después de la reserva:',
        items: [
          'Envía agradecimiento y confirma detalles clave.',
          'Pregunta si hay algo especial: alergias, preferencias, motivo del viaje.',
        ],
      },
      {
        tipo: 'lista',
        texto: 'Durante la estancia:',
        items: [
          'Un mensaje breve al día siguiente del check-in: "¿Todo bien? Cualquier cosa, escríbeme."',
          'No bombardees con mensajes. Acompañado pero no vigilado.',
        ],
      },
      {
        tipo: 'lista',
        texto: 'Después del check-out:',
        items: [
          'Mensaje de despedida agradeciendo la estancia.',
          'Invitación amable a dejar una reseña si la experiencia fue positiva.',
        ],
      },
      {
        tipo: 'destacado',
        texto: 'Usa las herramientas de la plataforma para toda la comunicación. No mezcles WhatsApp, correo personal y llamadas. La plataforma tiene registro de todo, lo que te protege en disputas.',
      },
    ],
  },
  {
    id: 'cancelaciones',
    titulo: 'No Canceles',
    icono: '🔒',
    contenido: [
      {
        tipo: 'parrafo',
        texto: 'Tu palabra es tu moneda más valiosa. Cancelar una reserva confirmada sin razón de fuerza mayor es uno de los golpes más duros que puedes darle a tu reputación.',
      },
      {
        tipo: 'lista',
        texto: 'Consecuencias de las cancelaciones:',
        items: [
          'Penalizaciones económicas.',
          'Reducción de visibilidad en búsquedas durante semanas o meses.',
          'Marcado en tu perfil visible para futuros huéspedes.',
          'Suspensión o eliminación del anuncio en casos graves.',
        ],
      },
      {
        tipo: 'lista',
        texto: 'Cómo evitar cancelaciones:',
        items: [
          'Mantén tu calendario actualizado. La doble reserva es la causa #1 de cancelaciones evitables.',
          'Sincroniza calendarios si publicas en más de una plataforma.',
          'Sé realista con tu disponibilidad.',
          'Si necesitas cancelar, hazlo con la mayor anticipación posible y ofrece alternativas.',
        ],
      },
    ],
  },
  {
    id: 'amenidades',
    titulo: 'Las Amenidades',
    icono: '🏨',
    contenido: [
      {
        tipo: 'parrafo',
        texto: 'Las amenidades son los servicios y comodidades que tu boogie pone a disposición del huésped. La diferencia entre lo que anuncias y lo que realmente existe tiene que ser cero.',
      },
      {
        tipo: 'lista',
        texto: 'Amenidades básicas que se esperan:',
        items: [
          'Ropa de cama limpia y de calidad.',
          'Toallas (mínimo una por persona).',
          'Wifi funcional y decente.',
          'Productos de aseo: jabón, champú, papel higiénico.',
          'Cocina equipada si la ofreces.',
          'Espacio para ropa: armario o percheros.',
        ],
      },
      {
        tipo: 'lista',
        texto: 'Amenidades que marcan la diferencia:',
        items: [
          'Cafetera con café de calidad.',
          'Guía del vecindario personalizada.',
          'Cargadores universales o cables de carga.',
          'Kit de primeros auxilios básico.',
          'Adaptadores de enchufe internacionales.',
          'Información sobre transporte local.',
          'Televisor con streaming, libros, juegos de mesa.',
        ],
      },
      {
        tipo: 'destacado',
        texto: 'Si anuncias una amenidad, tiene que estar disponible y funcional durante toda la estancia. Piscina dañada, A/C roto, estacionamiento no disponible: dilo claramente en la descripción.',
      },
    ],
  },
  {
    id: 'algoritmo',
    titulo: 'Domina el Algoritmo',
    icono: '🚀',
    contenido: [
      {
        tipo: 'parrafo',
        texto: 'El algoritmo está diseñado con un objetivo claro: mostrar a cada huésped potencial el anuncio con mayor probabilidad de recibir una reseña de cinco estrellas. Las señales más importantes son:',
      },
      {
        tipo: 'subtitulo',
        texto: '1. Tasa de conversión',
      },
      {
        tipo: 'parrafo',
        texto: 'El porcentaje de personas que ven tu anuncio y reservan. Es posiblemente el factor más importante. Mejora con: relación calidad-precio, fotos profesionales, descripción completa, reseñas positivas y políticas flexibles.',
      },
      {
        tipo: 'subtitulo',
        texto: '2. Reseñas y puntuaciones',
      },
      {
        tipo: 'parrafo',
        texto: 'La limpieza, la precisión del anuncio y la comunicación se ponderan especialmente. Las reseñas recientes tienen más peso que las antiguas. Una mala reseña puede arruinar veinte buenas. Construye un historial sólido.',
      },
      {
        tipo: 'subtitulo',
        texto: '3. Tiempo de respuesta y tasa de aceptación',
      },
      {
        tipo: 'parrafo',
        texto: 'Responder rápido es señal de confiabilidad. Considera la reserva instantánea para eliminar rechazos innecesarios y mejorar tu tasa de aceptación.',
      },
      {
        tipo: 'subtitulo',
        texto: '4. Consistencia en reservas',
      },
      {
        tipo: 'parrafo',
        texto: 'Un anuncio que se reserva regularmente es señal de demanda. Los que pasan meses sin reservas bajan en el ranking. Ofrece descuentos estratégicos y precios dinámicos.',
      },
      {
        tipo: 'subtitulo',
        texto: '5. Completitud del anuncio',
      },
      {
        tipo: 'parrafo',
        texto: 'Cada sección vacía es una señal negativa. Completa todo: descripción, amenidades, reglas, información del barrio, preguntas frecuentes, calendario actualizado.',
      },
      {
        tipo: 'subtitulo',
        texto: 'El distintivo de anfitrión destacado',
      },
      {
        tipo: 'lista',
        texto: 'Requisitos:',
        items: [
          'Calificación general de 4.8 o superior.',
          'Tasa de respuesta del 90% o más.',
          'Tasa de aceptación del 88% o más.',
          'Cero cancelaciones (excepto fuerza mayor).',
          'Al menos 10 estadías completadas o 3 que sumen 100+ noches.',
        ],
      },
      {
        tipo: 'destacado',
        texto: 'Los anuncios con este distintivo tienen tasas de conversión significativamente más altas, mayor visibilidad y pueden cobrar tarifas ligeramente superiores.',
      },
    ],
  },
  {
    id: 'marketing',
    titulo: 'Marketing',
    icono: '📱',
    contenido: [
      {
        tipo: 'parrafo',
        texto: 'Tener un excelente lugar es solo el 50%. El otro 50% es hacer que lo encuentren y lo deseen.',
      },
      {
        tipo: 'subtitulo',
        texto: 'El título magnético',
      },
      {
        tipo: 'lista-no',
        texto: 'Títulos débiles:',
        items: [
          '"Apartamento bonito"',
          '"Habitación disponible"',
          '"Céntrico y económico"',
        ],
      },
      {
        tipo: 'lista-si',
        texto: 'Títulos efectivos:',
        items: [
          '"Loft Iluminado con Balcón Privado y Vista Panorámica"',
          '"Estudio a Pasos de la Playa con Wifi Veloz y Cocina Equipada"',
          '"Casa Colonial Restaurada con Patio y Piscina en el Centro Histórico"',
        ],
      },
      {
        tipo: 'subtitulo',
        texto: 'Precios dinámicos',
      },
      {
        tipo: 'lista',
        texto: 'Factores que afectan el precio:',
        items: [
          'Temporada alta/baja: los precios pueden duplicarse o triplicarse.',
          'Eventos locales: conciertos, ferias, congresos.',
          'Día de la semana: fines de semana vs días laborales.',
          'Anticipación: descuentos de última hora vs reservas anticipadas.',
        ],
      },
      {
        tipo: 'subtitulo',
        texto: 'Redes sociales',
      },
      {
        tipo: 'lista',
        texto: 'Contenido que funciona en Instagram y TikTok:',
        items: [
          'Recorridos en video de 30-90 segundos.',
          'Guías del vecindario con fotos.',
          'Detalles detrás de cámaras: cómo preparas el espacio.',
          'Testimonios y reseñas destacadas.',
          'Contenido de temporada.',
          'Preguntas frecuentes respondidas en video.',
        ],
      },
      {
        tipo: 'destacado',
        texto: 'No necesitas publicar todos los días. 2-3 veces por semana con contenido de calidad es mejor que diario con contenido mediocre.',
      },
    ],
  },
  {
    id: 'toque-humano',
    titulo: 'El Toque Humano',
    icono: '🤝',
    contenido: [
      {
        tipo: 'parrafo',
        texto: 'Los estándares de calidad, el algoritmo y el marketing son la estructura; el toque humano es el alma. Aquí es donde los buenos anfitriones se vuelven legendarios.',
      },
      {
        tipo: 'subtitulo',
        texto: 'La bienvenida que se siente',
      },
      {
        tipo: 'lista',
        texto: 'Si puedes recibir personalmente:',
        items: [
          'Estar puntual.',
          'Ayudar con el equipaje.',
          'Recorrido rápido por el espacio: cerradura, luces, A/C, wifi.',
          'Recomendar un lugar cercano para cenar.',
        ],
      },
      {
        tipo: 'lista',
        texto: 'Si es check-in autónomo:',
        items: [
          'Instrucciones detalladas con fotos o video.',
          'Nota de bienvenida escrita a mano.',
          'Detalle de bienvenida: fruta, galletas, flores.',
        ],
      },
      {
        tipo: 'subtitulo',
        texto: 'Anticipa necesidades',
      },
      {
        tipo: 'lista',
        texto: 'Ejemplos de anticipación:',
        items: [
          'Familia con niños: retira objetos peligrosos, considera silla alta o juegos.',
          'Viaje de negocios: verifica wifi, escritorio iluminado, plancha disponible.',
          'Aniversario: flores, tarjeta, chocolates.',
          'Pronóstico de lluvia: deja paraguas, sugiere actividades bajo techo.',
        ],
      },
      {
        tipo: 'subtitulo',
        texto: 'Subpromete y sobrecumple',
      },
      {
        tipo: 'parrafo',
        texto: 'Promete un poco menos de lo que realmente entregas. Si tu vista es bonita, descríbela como "agradable". Si tu wifi es bueno, di "estable". La sorpresa genera más impacto que la expectativa.',
      },
      {
        tipo: 'subtitulo',
        texto: 'Resuelve problemas con gracia',
      },
      {
        tipo: 'lista',
        texto: 'Protocolo:',
        items: [
          'Reconoce el problema inmediatamente.',
          'Actúa rápido.',
          'Ofrece compensación apropiada.',
          'Haz seguimiento.',
          'Aprende y previene.',
        ],
      },
      {
        tipo: 'destacado',
        texto: 'Un problema bien resuelto puede generar una mejor reseña que una estancia sin problemas. Un huésped que vio cómo resolviste un inconveniente con rapidez y empatía puede quedar más impresionado.',
      },
    ],
  },
  {
    id: 'proteccion',
    titulo: 'Protege tu Espacio',
    icono: '🛡️',
    contenido: [
      {
        tipo: 'subtitulo',
        texto: 'Reglas de la casa',
      },
      {
        tipo: 'lista',
        texto: 'Reglas esenciales:',
        items: [
          'Política de fumar clara.',
          'Política de mascotas.',
          'Prohibición de fiestas y eventos no autorizados.',
          'Capacidad máxima.',
          'Horario de silencio.',
          'Cuidado del espacio: no mover muebles pesados, no clavar en paredes.',
          'Horarios de check-in y check-out.',
        ],
      },
      {
        tipo: 'subtitulo',
        texto: 'Protege tu inversión',
      },
      {
        tipo: 'lista',
        texto: 'Buenas prácticas:',
        items: [
          'Inventario básico de objetos y amenidades.',
          'Fotos de estado antes de cada huésped.',
          'Depósito de seguridad configurado.',
          'Seguro que cubra actividades de alquiler.',
          'Mantenimiento preventivo periódico.',
        ],
      },
      {
        tipo: 'subtitulo',
        texto: 'Relación con vecinos',
      },
      {
        tipo: 'lista',
        texto: '',
        items: [
          'Informa a los vecinos cercanos que el espacio se alquila.',
          'Establece expectativas claras con huéspedes sobre la comunidad.',
          'Deja un canal directo para quejas de vecinos.',
          'Sé proactivo ante cualquier queja.',
        ],
      },
    ],
  },
  {
    id: 'tendencias',
    titulo: 'Tendencias 2026',
    icono: '🔮',
    contenido: [
      {
        tipo: 'subtitulo',
        texto: 'Contenido con IA',
      },
      {
        tipo: 'lista',
        texto: 'Herramientas que dan ventaja:',
        items: [
          'Videos generados a partir de fotos estáticas.',
          'Descripciones optimizadas automáticamente.',
          'Respuestas automatizadas a preguntas frecuentes.',
        ],
      },
      {
        tipo: 'subtitulo',
        texto: 'Experiencias inmersivas',
      },
      {
        tipo: 'lista',
        texto: '',
        items: [
          'Experiencias locales: clases de cocina, tours gastronómicos.',
          'Bienestar y desconexión: espacios sin TV en dormitorios, aromaterapia.',
          'Personalización extrema: temperatura ajustada, playlist curada.',
        ],
      },
      {
        tipo: 'subtitulo',
        texto: 'Sostenibilidad',
      },
      {
        tipo: 'lista',
        texto: '',
        items: [
          'Productos biodegradables o en envases recargables.',
          'Iluminación LED.',
          'Separación de residuos con contenedores diferenciados.',
          'Productos locales en el kit de bienvenida.',
        ],
      },
      {
        tipo: 'subtitulo',
        texto: 'Tecnología integrada',
      },
      {
        tipo: 'lista',
        texto: '',
        items: [
          'Cerraduras inteligentes para check-in autónomo.',
          'Cargadores inalámbricos en mesas de noche.',
          'Pantallas inteligentes con manual de la casa.',
        ],
      },
      {
        tipo: 'subtitulo',
        texto: 'Estancias largas',
      },
      {
        tipo: 'lista',
        texto: 'Adapta tu oferta para trabajo remoto:',
        items: [
          'Descuentos mensuales de 20-30%.',
          'Espacio de trabajo funcional: escritorio, silla ergonómica, buena iluminación.',
          'Lavandería accesible.',
          'Cocina completa y equipada.',
          'Flexibilidad en la duración.',
        ],
      },
    ],
  },
  {
    id: 'plan-accion',
    titulo: 'Plan de Acción',
    icono: '📋',
    contenido: [
      {
        tipo: 'subtitulo',
        texto: 'Fase 1: Preparación (Semana 1-2)',
      },
      {
        tipo: 'lista',
        texto: '',
        items: [
          'Día 1-3: Auditoría del espacio como huésped crítico.',
          'Día 4-7: Reparaciones, compras de insumos, 2-3 mejoras que marquen diferencia.',
          'Día 8-10: Sesión de fotos con la mejor iluminación posible.',
          'Día 11-14: Escribir título, descripción y reglas. Completar TODAS las secciones. Configurar precios dinámicos.',
        ],
      },
      {
        tipo: 'subtitulo',
        texto: 'Fase 2: Lanzamiento (Semana 3-6)',
      },
      {
        tipo: 'lista',
        texto: '',
        items: [
          'Activar anuncio y configurar notificaciones.',
          'Considerar descuento temporal para primeras reservas.',
          'Responder cada consulta con rapidez.',
          'Experiencia impecable a cada primer huésped.',
          'Pedir reseñas amablemente.',
        ],
      },
      {
        tipo: 'subtitulo',
        texto: 'Fase 3: Crecimiento (Mes 2-3)',
      },
      {
        tipo: 'lista',
        texto: '',
        items: [
          'Analizar primeras reseñas: patrones, mejoras.',
          'Ajustar precios según demanda real.',
          'Crear primeras publicaciones en redes sociales.',
          'Implementar estrategia de fidelización.',
          'Establecer protocolo de limpieza con checklist.',
        ],
      },
      {
        tipo: 'subtitulo',
        texto: 'Fase 4: Consolidación (Mes 4-6)',
      },
      {
        tipo: 'lista',
        texto: '',
        items: [
          'Evaluar rendimiento: ocupación, ingresos, calificación.',
          'Invertir en mejoras basadas en feedback.',
          'Considerar ayuda: limpieza, co-anfitrión.',
          'Trabajar hacia el distintivo de anfitrión destacado.',
        ],
      },
      {
        tipo: 'subtitulo',
        texto: 'Fase 5: Maestría (Mes 6+)',
      },
      {
        tipo: 'lista',
        texto: '',
        items: [
          'Enfocarse en la excelencia: cada huésped debe tener una experiencia memorable.',
          'Mantente actualizado con tendencias.',
          'Desarrollar relaciones con huéspedes recurrentes.',
          'Evaluar expansión: ¿un segundo espacio?',
          'Compartir conocimiento con otros anfitriones.',
        ],
      },
    ],
  },
  {
    id: 'errores',
    titulo: 'Errores Comunes',
    icono: '⚠️',
    contenido: [
      {
        tipo: 'lista',
        texto: 'Los 10 errores más frecuentes y completamente evitables:',
        items: [
          'Subestimar la importancia de las fotos. Son tu vendedor 24/7.',
          'Fijar un precio y olvidarse. El mercado cambia constantemente.',
          'No leer las reseñas de la competencia. Son una mina de oro de información.',
          'Ser invisible después del check-out. El seguimiento es parte de la experiencia.',
          'Ignorar los pequeños detalles: un interruptor roto, un grifo que gotea.',
          'No tener un plan para emergencias. Un anfitrión preparado genera confianza.',
          'Compararse constantemente con otros. Tu autenticidad es tu mayor fortaleza.',
          'Querer hacer todo solo. Delega a medida que creces.',
          'No disfrutar el proceso. Si es estrés constante, algo está mal.',
          'Olvidar por qué empezaste. Mantén tu motivación viva.',
        ],
      },
    ],
  },
  {
    id: 'palabras-finales',
    titulo: 'Palabras Finales',
    icono: '🎯',
    contenido: [
      {
        tipo: 'destacado',
        texto: 'El éxito en los boogies no es cuestión de suerte. Es la suma de calidad incuestionable, comunicación impecable, marketing inteligente y un toque de magia humana que no se puede falsificar.',
      },
      {
        tipo: 'parrafo',
        texto: 'Tu boogie no es solo un espacio físico. Es una experiencia, una promesa de confort, descubrimiento y atención. Es la posibilidad de que alguien que viene de lejos abra la puerta y sienta que llegó a un lugar donde se preocupa por su bienestar.',
      },
      {
        tipo: 'parrafo',
        texto: 'Al seguir esta guía, no solo estás listando una propiedad. Estás construyendo una reputación, un negocio sostenible y una fuente de ingresos que puede transformar tu vida financiera.',
      },
      {
        tipo: 'parrafo',
        texto: 'Habrá huéspedes complicados, noches de estrés, momentos de duda. Pero también habrá reseñas que te hagan sonreír, mensajes de agradecimiento que te lleguen al corazón, y huéspedes que se conviertan en amigos.',
      },
      {
        tipo: 'destacado',
        texto: 'Tu boogie, tus reglas, tu éxito. A darle con todo.',
      },
    ],
  },
]

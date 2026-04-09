'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag, Plus, Minus, Trash2, X, ChevronDown,
  Sparkles, Package, ConciergeBell, ArrowRight, DollarSign,
} from 'lucide-react'
import type { StoreProducto, StoreServicio, CartItem, CategoriaStoreProducto, CategoriaStoreServicio, TipoPrecio } from '@/lib/store-constants'
import { CATEGORIAS_STORE_PRODUCTO, CATEGORIAS_STORE_SERVICIO, TIPOS_PRECIO_LABELS } from '@/lib/store-constants'
import { getProductosStore, getServiciosStore } from '@/actions/boogie-store.actions'

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 10, filter: 'blur(3px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

type Tab = 'productos' | 'servicios'

interface BoogieStoreProps {
  noches: number
  tasaCambio: number
  onContinue: (cart: CartItem[]) => void
  onBack: () => void
  initialCart?: CartItem[]
}

function formatUSD(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatVES(n: number, tasa: number) {
  return `Bs. ${(n * tasa).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function BoogieStore({ noches, tasaCambio, onContinue, onBack, initialCart }: BoogieStoreProps) {
  const [tab, setTab] = useState<Tab>('productos')
  const [productos, setProductos] = useState<StoreProducto[]>([])
  const [servicios, setServicios] = useState<StoreServicio[]>([])
  const [cart, setCart] = useState<CartItem[]>(initialCart || [])
  const [cartOpen, setCartOpen] = useState(false)
  const [moneda, setMoneda] = useState<'USD' | 'VES'>('USD')
  const [loading, setLoading] = useState(true)
  const [catFilterProd, setCatFilterProd] = useState<string>('all')
  const [catFilterServ, setCatFilterServ] = useState<string>('all')

  useEffect(() => {
    const load = async () => {
      const [prods, servs] = await Promise.all([getProductosStore(), getServiciosStore()])
      setProductos(prods)
      setServicios(servs)
      setLoading(false)
    }
    load()
  }, [])

  const addToCart = useCallback((item: StoreProducto | StoreServicio, tipo: 'producto' | 'servicio') => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id && c.tipo === tipo)
      if (existing) {
        return prev.map((c) => c.id === item.id && c.tipo === tipo ? { ...c, cantidad: c.cantidad + 1 } : c)
      }
      return [...prev, {
        id: item.id,
        tipo,
        nombre: item.nombre,
        precio: item.precio,
        moneda: item.moneda,
        cantidad: 1,
        tipoPrecio: tipo === 'servicio' ? (item as StoreServicio).tipoPrecio : undefined,
        imagenUrl: item.imagenUrl,
      }]
    })
  }, [])

  const removeFromCart = useCallback((id: string, tipo: 'producto' | 'servicio') => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.id === id && c.tipo === tipo)
      if (idx === -1) return prev
      if (prev[idx].cantidad > 1) {
        return prev.map((c) => c.id === id && c.tipo === tipo ? { ...c, cantidad: c.cantidad - 1 } : c)
      }
      return prev.filter((c) => !(c.id === id && c.tipo === tipo))
    })
  }, [])

  const deleteFromCart = useCallback((id: string, tipo: 'producto' | 'servicio') => {
    setCart((prev) => prev.filter((c) => !(c.id === id && c.tipo === tipo)))
  }, [])

  const getCartQty = (id: string, tipo: 'producto' | 'servicio') => {
    return cart.find((c) => c.id === id && c.tipo === tipo)?.cantidad || 0
  }

  const cartTotal = cart.reduce((sum, item) => {
    const precioBase = item.precio
    const esPorNoche = item.tipo === 'servicio' && item.tipoPrecio === 'POR_NOCHE'
    return sum + (esPorNoche ? precioBase * noches : precioBase) * item.cantidad
  }, 0)

  const cartCount = cart.reduce((sum, item) => sum + item.cantidad, 0)

  const filteredProductos = catFilterProd === 'all'
    ? productos
    : productos.filter((p) => p.categoria === catFilterProd)

  const filteredServicios = catFilterServ === 'all'
    ? servicios
    : servicios.filter((s) => s.categoria === catFilterServ)

  const prodCategorias = ['all', ...Array.from(new Set(productos.map((p) => p.categoria)))]
  const servCategorias = ['all', ...Array.from(new Set(servicios.map((s) => s.categoria)))]

  const formatPrecio = (n: number) => moneda === 'USD' ? formatUSD(n) : formatVES(n, tasaCambio)

  const getItemTotal = (item: CartItem) => {
    const esPorNoche = item.tipo === 'servicio' && item.tipoPrecio === 'POR_NOCHE'
    return (esPorNoche ? item.precio * noches : item.precio) * item.cantidad
  }

  return (
    <div className="relative">
      <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">

        <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C]">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-white/5" />
          <div className="relative flex items-center justify-between p-5">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                <Sparkles className="h-5 w-5" />
                Arma tu Boogie!
              </h2>
              <p className="mt-1 text-xs text-white/60">Agrega productos y servicios a tu estadia</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMoneda(moneda === 'USD' ? 'VES' : 'USD')}
                className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-white/20"
              >
                {moneda === 'USD' ? 'USD $' : 'BS Bs.'}
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="flex gap-1 rounded-xl bg-[#F8F6F3] p-1">
          <button
            onClick={() => setTab('productos')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
              tab === 'productos' ? 'bg-white text-[#1B4332] shadow-sm' : 'text-[#9E9892] hover:text-[#6B6560]'
            }`}
          >
            <Package className="h-4 w-4" />
            Productos
          </button>
          <button
            onClick={() => setTab('servicios')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
              tab === 'servicios' ? 'bg-white text-[#1B4332] shadow-sm' : 'text-[#9E9892] hover:text-[#6B6560]'
            }`}
          >
            <ConciergeBell className="h-4 w-4" />
            Servicios
          </button>
        </motion.div>

        <motion.div variants={fadeUp}>
          <AnimatePresence mode="wait">
            {tab === 'productos' && (
              <motion.div key="productos" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {prodCategorias.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCatFilterProd(cat)}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        catFilterProd === cat
                          ? 'bg-[#1B4332] text-white'
                          : 'bg-white text-[#6B6560] border border-[#E8E4DF] hover:border-[#1B4332]/30'
                      }`}
                    >
                      {cat === 'all' ? 'Todos' : CATEGORIAS_STORE_PRODUCTO[cat as CategoriaStoreProducto]}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
            {tab === 'servicios' && (
              <motion.div key="servicios" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {servCategorias.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCatFilterServ(cat)}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        catFilterServ === cat
                          ? 'bg-[#1B4332] text-white'
                          : 'bg-white text-[#6B6560] border border-[#E8E4DF] hover:border-[#1B4332]/30'
                      }`}
                    >
                      {cat === 'all' ? 'Todos' : CATEGORIAS_STORE_SERVICIO[cat as CategoriaStoreServicio]}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div variants={fadeUp} className="min-h-[240px]">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1B4332] border-t-transparent" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {tab === 'productos' ? (
                <motion.div key="prod-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 gap-2.5">
                  {filteredProductos.length === 0 && (
                    <div className="col-span-2 py-12 text-center text-sm text-[#9E9892]">No hay productos disponibles</div>
                  )}
                  {filteredProductos.map((prod) => {
                    const qty = getCartQty(prod.id, 'producto')
                    return (
                      <motion.div
                        key={prod.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`relative rounded-xl border bg-white p-3 transition-all ${
                          qty > 0 ? 'border-[#52B788] ring-1 ring-[#52B788]/30' : 'border-[#E8E4DF]'
                        }`}
                      >
                        {prod.imagenUrl ? (
                          <div className="relative mb-2 h-20 w-full overflow-hidden rounded-lg bg-[#F8F6F3]">
                            <img src={prod.imagenUrl} alt={prod.nombre} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="mb-2 flex h-20 items-center justify-center rounded-lg bg-[#D8F3DC]/40">
                            <Package className="h-8 w-8 text-[#1B4332]/30" />
                          </div>
                        )}
                        <h3 className="text-xs font-bold text-[#1A1A1A] leading-tight">{prod.nombre}</h3>
                        {prod.descripcion && (
                          <p className="mt-0.5 text-[10px] text-[#9E9892] line-clamp-2">{prod.descripcion}</p>
                        )}
                        <p className="mt-2 text-sm font-bold text-[#1B4332]">{formatPrecio(prod.precio)}</p>
                        <div className="mt-2 flex items-center justify-end gap-1.5">
                          {qty > 0 && (
                            <>
                              <button
                                onClick={() => removeFromCart(prod.id, 'producto')}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E8E4DF] text-[#6B6560] transition-all hover:bg-[#F8F6F3]"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="min-w-[20px] text-center text-xs font-bold text-[#1B4332]">{qty}</span>
                            </>
                          )}
                          <button
                            onClick={() => addToCart(prod, 'producto')}
                            className="flex h-7 items-center gap-1 rounded-lg bg-[#1B4332] px-2.5 text-xs font-semibold text-white transition-all hover:bg-[#2D6A4F] active:scale-95"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              ) : (
                <motion.div key="serv-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 gap-2.5">
                  {filteredServicios.length === 0 && (
                    <div className="py-12 text-center text-sm text-[#9E9892]">No hay servicios disponibles</div>
                  )}
                  {filteredServicios.map((serv) => {
                    const qty = getCartQty(serv.id, 'servicio')
                    const esPorNoche = serv.tipoPrecio === 'POR_NOCHE'
                    const precioTotal = esPorNoche ? serv.precio * noches : serv.precio
                    return (
                      <motion.div
                        key={serv.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`relative rounded-xl border bg-white p-3.5 transition-all ${
                          qty > 0 ? 'border-[#52B788] ring-1 ring-[#52B788]/30' : 'border-[#E8E4DF]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {serv.imagenUrl ? (
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                              <img src={serv.imagenUrl} alt={serv.nombre} className="h-full w-full object-cover" />
                            </div>
                          ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#D8F3DC]/60">
                              <ConciergeBell className="h-5 w-5 text-[#1B4332]" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-[#1A1A1A]">{serv.nombre}</h3>
                            {serv.descripcion && (
                              <p className="mt-0.5 text-[11px] text-[#9E9892] line-clamp-2">{serv.descripcion}</p>
                            )}
                            <div className="mt-1.5 flex items-center gap-2">
                              <span className="text-sm font-bold text-[#1B4332]">{formatPrecio(precioTotal)}</span>
                              {esPorNoche && (
                                <span className="rounded bg-[#FEF3C7] px-1.5 py-0.5 text-[9px] font-semibold text-[#92400E]">
                                  x {noches} noches
                                </span>
                              )}
                              <span className="text-[10px] text-[#9E9892]">
                                ({TIPOS_PRECIO_LABELS[serv.tipoPrecio as TipoPrecio].toLowerCase()})
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {qty > 0 && (
                              <>
                                <button
                                  onClick={() => removeFromCart(serv.id, 'servicio')}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E8E4DF] text-[#6B6560] transition-all hover:bg-[#F8F6F3]"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="min-w-[20px] text-center text-xs font-bold text-[#1B4332]">{qty}</span>
                              </>
                            )}
                            <button
                              onClick={() => addToCart(serv, 'servicio')}
                              className="flex h-7 items-center gap-1 rounded-lg bg-[#1B4332] px-2.5 text-xs font-semibold text-white transition-all hover:bg-[#2D6A4F] active:scale-95"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </motion.div>

        <motion.div variants={fadeUp}>
          <button
            onClick={() => setCartOpen(true)}
            className={`relative flex w-full items-center justify-between rounded-xl border p-3.5 transition-all ${
              cartCount > 0 ? 'border-[#52B788] bg-[#D8F3DC]/30' : 'border-[#E8E4DF] bg-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <ShoppingBag className={`h-5 w-5 ${cartCount > 0 ? 'text-[#1B4332]' : 'text-[#9E9892]'}`} />
                {cartCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#1B4332] text-[9px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </div>
              <div>
                <p className={`text-sm font-semibold ${cartCount > 0 ? 'text-[#1A1A1A]' : 'text-[#9E9892]'}`}>
                  {cartCount > 0 ? `${cartCount} item${cartCount > 1 ? 's' : ''} en el carrito` : 'Carrito vacio'}
                </p>
                {cartTotal > 0 && (
                  <p className="text-xs text-[#52B788] font-medium">{formatPrecio(cartTotal)}</p>
                )}
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-[#9E9892]" />
          </button>
        </motion.div>

        <motion.div variants={fadeUp} className="flex gap-3 pt-1">
          <button
            onClick={onBack}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-[#E8E4DF] bg-white text-sm font-semibold text-[#6B6560] transition-all hover:bg-[#F8F6F3]"
          >
            Atras
          </button>
          <button
            onClick={() => onContinue(cart)}
            className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-xl bg-[#1B4332] text-sm font-semibold text-white transition-all hover:bg-[#2D6A4F] active:scale-[0.98]"
          >
            Continuar al pago
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setCartOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-2xl border-t border-[#E8E4DF] bg-white"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E8E4DF] bg-white px-5 py-4">
                <h3 className="flex items-center gap-2 text-base font-bold text-[#1A1A1A]">
                  <ShoppingBag className="h-5 w-5 text-[#1B4332]" />
                  Tu carrito
                </h3>
                <button
                  onClick={() => setCartOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9E9892] transition-colors hover:bg-[#F8F6F3] hover:text-[#1A1A1A]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12">
                  <ShoppingBag className="h-10 w-10 text-[#E8E4DF]" />
                  <p className="text-sm text-[#9E9892]">Tu carrito esta vacio</p>
                </div>
              ) : (
                <div className="p-5">
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={`${item.tipo}-${item.id}`} className="flex items-center gap-3 rounded-xl border border-[#E8E4DF] p-3">
                        {item.imagenUrl ? (
                          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg">
                            <img src={item.imagenUrl} alt={item.nombre} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            item.tipo === 'producto' ? 'bg-[#D8F3DC]/60' : 'bg-[#FEF3C7]/60'
                          }`}>
                            {item.tipo === 'producto' ? (
                              <Package className="h-4 w-4 text-[#1B4332]" />
                            ) : (
                              <ConciergeBell className="h-4 w-4 text-[#92400E]" />
                            )}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#1A1A1A] truncate">{item.nombre}</p>
                          <p className="text-[10px] text-[#9E9892]">
                            {formatPrecio(item.tipo === 'servicio' && item.tipoPrecio === 'POR_NOCHE' ? item.precio * noches : item.precio)} c/u
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => removeFromCart(item.id, item.tipo)}
                            className="flex h-6 w-6 items-center justify-center rounded border border-[#E8E4DF] text-[#6B6560] hover:bg-[#F8F6F3]"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="min-w-[20px] text-center text-xs font-bold">{item.cantidad}</span>
                          <button
                            onClick={() => addToCart(
                              { id: item.id, nombre: item.nombre, precio: item.precio, moneda: item.moneda, imagenUrl: item.imagenUrl, tipoPrecio: item.tipoPrecio } as StoreProducto & StoreServicio,
                              item.tipo
                            )}
                            className="flex h-6 w-6 items-center justify-center rounded border border-[#E8E4DF] text-[#6B6560] hover:bg-[#F8F6F3]"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="w-16 text-right">
                          <p className="text-xs font-bold text-[#1B4332]">{formatPrecio(getItemTotal(item))}</p>
                        </div>
                        <button
                          onClick={() => deleteFromCart(item.id, item.tipo)}
                          className="flex h-6 w-6 items-center justify-center rounded text-[#9E9892] hover:text-[#C1121F] transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 border-t border-[#E8E4DF] pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#1A1A1A]">Total del carrito</span>
                      <span className="text-lg font-bold text-[#1B4332]">{formatPrecio(cartTotal)}</span>
                    </div>
                    {moneda === 'USD' && (
                      <p className="mt-1 text-right text-xs text-[#9E9892]">
                        Aprox. {formatVES(cartTotal, tasaCambio)}
                      </p>
                    )}
                    {moneda === 'VES' && (
                      <p className="mt-1 text-right text-xs text-[#9E9892]">
                        Aprox. {formatUSD(cartTotal)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

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

        <motion.div variants={fadeUp} className="max-h-[340px] overflow-y-auto rounded-xl scrollbar-thin">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1B4332] border-t-transparent" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {tab === 'productos' ? (
                <motion.div key="prod-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 gap-1.5 p-1 sm:grid-cols-3 md:grid-cols-5">
                  {filteredProductos.length === 0 && (
                    <div className="col-span-2 py-12 text-center text-sm text-[#9E9892] sm:col-span-3 md:col-span-5">No hay productos disponibles</div>
                  )}
                  {filteredProductos.map((prod) => {
                    const qty = getCartQty(prod.id, 'producto')
                    return (
                      <motion.div
                        key={prod.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`relative rounded-lg border bg-white overflow-hidden transition-all ${
                          qty > 0 ? 'border-[#52B788] ring-1 ring-[#52B788]/30' : 'border-[#E8E4DF]'
                        }`}
                      >
                        <div className="relative w-full aspect-[3/4] bg-[#F8F6F3]">
                          {prod.imagenUrl ? (
                            <img src={prod.imagenUrl} alt={prod.nombre} className="h-full w-full object-contain" />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Package className="h-5 w-5 text-[#1B4332]/20" />
                            </div>
                          )}
                          {qty > 0 && (
                            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#1B4332] text-[8px] font-bold text-white">
                              {qty}
                            </span>
                          )}
                        </div>
                        <div className="p-1.5">
                          <h3 className="text-[9px] font-bold text-[#1A1A1A] leading-tight line-clamp-1">{prod.nombre}</h3>
                          <p className="mt-0.5 text-[10px] font-bold text-[#1B4332]">{formatPrecio(prod.precio)}</p>
                          <div className="mt-1 flex items-center justify-end gap-1">
                            {qty > 0 && (
                              <button
                                onClick={() => removeFromCart(prod.id, 'producto')}
                                className="flex h-5 w-5 items-center justify-center rounded border border-[#E8E4DF] text-[#6B6560] transition-all hover:bg-[#F8F6F3]"
                              >
                                <Minus className="h-2.5 w-2.5" />
                              </button>
                            )}
                            {qty > 0 && (
                              <span className="min-w-[12px] text-center text-[9px] font-bold text-[#1B4332]">{qty}</span>
                            )}
                            <button
                              onClick={() => addToCart(prod, 'producto')}
                              className="flex h-5 w-5 items-center justify-center rounded bg-[#1B4332] text-white transition-all hover:bg-[#2D6A4F] active:scale-95"
                            >
                              <Plus className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              ) : (
                <motion.div key="serv-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2 p-1">
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
                        className={`relative rounded-xl border bg-white p-2.5 transition-all ${
                          qty > 0 ? 'border-[#52B788] ring-1 ring-[#52B788]/30' : 'border-[#E8E4DF]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-lg bg-[#F8F6F3]">
                            {serv.imagenUrl ? (
                              <img src={serv.imagenUrl} alt={serv.nombre} className="h-full w-full object-contain" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <ConciergeBell className="h-4 w-4 text-[#1B4332]/30" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[11px] font-bold text-[#1A1A1A]">{serv.nombre}</h3>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-[#1B4332]">{formatPrecio(precioTotal)}</span>
                              {esPorNoche && (
                                <span className="rounded bg-[#FEF3C7] px-1 py-0.5 text-[8px] font-semibold text-[#92400E]">
                                  x {noches}n
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {qty > 0 && (
                              <>
                                <button
                                  onClick={() => removeFromCart(serv.id, 'servicio')}
                                  className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#E8E4DF] text-[#6B6560] transition-all hover:bg-[#F8F6F3]"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="min-w-[16px] text-center text-[10px] font-bold text-[#1B4332]">{qty}</span>
                              </>
                            )}
                            <button
                              onClick={() => addToCart(serv, 'servicio')}
                              className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#1B4332] text-xs font-semibold text-white transition-all hover:bg-[#2D6A4F] active:scale-95"
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
          <div className={`rounded-xl border transition-all ${
            cartOpen
              ? 'border-[#1B4332]/20 shadow-sm overflow-hidden'
              : cartCount > 0
                ? 'border-[#52B788] overflow-hidden'
                : 'border-[#E8E4DF] overflow-hidden'
          }`}>
            <button
              onClick={() => setCartOpen(!cartOpen)}
              className={`relative flex w-full items-center justify-between p-3 transition-colors ${
                cartOpen
                  ? 'bg-[#F0FDF4]'
                  : cartCount > 0
                    ? 'bg-[#D8F3DC]/30'
                    : 'bg-white'
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
                <div className="text-left">
                  <p className={`text-sm font-semibold ${cartCount > 0 ? 'text-[#1A1A1A]' : 'text-[#9E9892]'}`}>
                    {cartCount > 0 ? `${cartCount} item${cartCount > 1 ? 's' : ''} en el carrito` : 'Carrito vacio'}
                  </p>
                  {cartTotal > 0 && (
                    <p className="text-xs text-[#52B788] font-medium">{formatPrecio(cartTotal)}</p>
                  )}
                </div>
              </div>
              <motion.div animate={{ rotate: cartOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className={`h-4 w-4 transition-colors ${cartOpen ? 'text-[#1B4332]' : 'text-[#9E9892]'}`} />
              </motion.div>
            </button>

            <AnimatePresence>
              {cartOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-[#1B4332]/10 bg-white">
                    {cart.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-8">
                        <ShoppingBag className="h-8 w-8 text-[#E8E4DF]" />
                        <p className="text-xs text-[#9E9892]">Aun no has agregado nada</p>
                      </div>
                    ) : (
                      <>
                        <div className="max-h-[200px] overflow-y-auto scrollbar-thin">
                          <div className="divide-y divide-[#F4F1EC]">
                            {cart.map((item) => (
                              <div
                                key={`${item.tipo}-${item.id}`}
                                className="flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-[#FEFCF9] transition-colors"
                              >
                                <div className="relative h-8 w-6 shrink-0 overflow-hidden rounded bg-[#F8F6F3]">
                                  {item.imagenUrl ? (
                                    <img src={item.imagenUrl} alt={item.nombre} className="h-full w-full object-contain" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                      {item.tipo === 'producto' ? (
                                        <Package className="h-3.5 w-3.5 text-[#1B4332]/30" />
                                      ) : (
                                        <ConciergeBell className="h-3.5 w-3.5 text-[#92400E]/30" />
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-semibold text-[#1A1A1A] truncate">{item.nombre}</p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => removeFromCart(item.id, item.tipo)}
                                    className="flex h-5 w-5 items-center justify-center rounded border border-[#E8E4DF] text-[#6B6560] hover:bg-[#F8F6F3]"
                                  >
                                    <Minus className="h-2.5 w-2.5" />
                                  </button>
                                  <span className="min-w-[16px] text-center text-[10px] font-bold text-[#1B4332]">{item.cantidad}</span>
                                  <button
                                    onClick={() => addToCart(
                                      { id: item.id, nombre: item.nombre, precio: item.precio, moneda: item.moneda, imagenUrl: item.imagenUrl, tipoPrecio: item.tipoPrecio } as StoreProducto & StoreServicio,
                                      item.tipo
                                    )}
                                    className="flex h-5 w-5 items-center justify-center rounded border border-[#E8E4DF] text-[#6B6560] hover:bg-[#F8F6F3]"
                                  >
                                    <Plus className="h-2.5 w-2.5" />
                                  </button>
                                </div>
                                <p className="w-14 text-right text-[11px] font-bold text-[#1B4332]">{formatPrecio(getItemTotal(item))}</p>
                                <button
                                  onClick={() => deleteFromCart(item.id, item.tipo)}
                                  className="flex h-5 w-5 items-center justify-center rounded text-[#9E9892] hover:text-[#C1121F] transition-colors"
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-[#1B4332]/10 bg-[#F0FDF4] px-3.5 py-2.5 rounded-b-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#1A1A1A]">Total</span>
                            <span className="text-sm font-bold text-[#1B4332]">{formatPrecio(cartTotal)}</span>
                          </div>
                          {moneda === 'USD' && (
                            <p className="mt-0.5 text-right text-[10px] text-[#9E9892]">
                              Aprox. {formatVES(cartTotal, tasaCambio)}
                            </p>
                          )}
                          {moneda === 'VES' && (
                            <p className="mt-0.5 text-right text-[10px] text-[#9E9892]">
                              Aprox. {formatUSD(cartTotal)}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
    </div>
  )
}

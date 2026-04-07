import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  ShoppingCart, Plus, Minus, Trash2, ChevronRight,
  Clock, CheckCircle2, CupSoda, Star, Sparkles, X
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  tag?: "bestseller" | "new" | "special";
  emoji: string;
}

interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  customizations: Customizations;
  linePrice: number;
}

interface Customizations {
  size: "M" | "L";
  sugar: "0%" | "25%" | "50%" | "75%" | "100%";
  ice: "No Ice" | "Less Ice" | "Regular" | "Extra Ice";
  toppings: string[];
}

// ── Static data ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "milk-tea", label: "Milk Teas" },
  { id: "fruit-tea", label: "Fruit Teas" },
  { id: "slushie", label: "Slushies" },
  { id: "special", label: "Specials" },
];

const MENU: MenuItem[] = [
  // Milk Teas
  { id: "mt1", name: "Brown Sugar Milk Tea", description: "Rich black tea with creamy milk & handcrafted brown sugar syrup", price: 6.5, category: "milk-tea", tag: "bestseller", emoji: "🧋" },
  { id: "mt2", name: "Taro Milk Tea", description: "Velvety taro root blended with fresh milk & black tea", price: 6.5, category: "milk-tea", emoji: "🫐" },
  { id: "mt3", name: "Matcha Milk Tea", description: "Ceremonial grade matcha whisked with oat milk", price: 7.0, category: "milk-tea", tag: "new", emoji: "🍵" },
  { id: "mt4", name: "Thai Milk Tea", description: "Bold orange-spiced Thai tea with condensed milk", price: 6.0, category: "milk-tea", emoji: "🍊" },
  { id: "mt5", name: "Jasmine Pearl Milk Tea", description: "Delicate jasmine green tea with whole milk foam", price: 6.5, category: "milk-tea", emoji: "🌸" },
  // Fruit Teas
  { id: "ft1", name: "Passion Fruit Green Tea", description: "Tangy passion fruit over iced jasmine green tea", price: 6.0, category: "fruit-tea", tag: "bestseller", emoji: "🍋" },
  { id: "ft2", name: "Strawberry Lychee Tea", description: "Sweet strawberry purée with fragrant lychee & oolong", price: 6.5, category: "fruit-tea", emoji: "🍓" },
  { id: "ft3", name: "Mango Yakult", description: "Fresh mango blended with Yakult & green tea base", price: 6.5, category: "fruit-tea", tag: "new", emoji: "🥭" },
  { id: "ft4", name: "Peach Oolong", description: "White peach syrup with high-mountain oolong, lightly sparkling", price: 6.0, category: "fruit-tea", emoji: "🍑" },
  { id: "ft5", name: "Watermelon Mint Tea", description: "Fresh-pressed watermelon with spearmint & hibiscus tea", price: 6.5, category: "fruit-tea", emoji: "🍉" },
  // Slushies
  { id: "sl1", name: "Taro Slushie", description: "Frozen taro smoothie with coconut cream swirl", price: 7.0, category: "slushie", emoji: "🫐" },
  { id: "sl2", name: "Matcha Latte Slushie", description: "Blended matcha with oat milk & ice crystals", price: 7.5, category: "slushie", tag: "bestseller", emoji: "🍵" },
  { id: "sl3", name: "Strawberry Milk Slushie", description: "Creamy strawberry frozen blend with fresh milk", price: 7.0, category: "slushie", emoji: "🍓" },
  // Specials
  { id: "sp1", name: "Tiger Brown Sugar", description: "Dramatic tiger-stripe brown sugar milk with fresh pearls", price: 8.0, category: "special", tag: "special", emoji: "🐯" },
  { id: "sp2", name: "Cheese Foam Oolong", description: "Salted cheese cream topping over cold-brew oolong", price: 7.5, category: "special", emoji: "🧀" },
  { id: "sp3", name: "Osmanthus Honey Latte", description: "Floral osmanthus syrup with honey & fresh milk foam", price: 7.5, category: "special", tag: "new", emoji: "🌼" },
];

const SIZE_EXTRA: Record<"M" | "L", number> = { M: 0, L: 0.75 };
const TOPPINGS_LIST = [
  { id: "pearls", label: "Tapioca Pearls", price: 0.75 },
  { id: "coconut", label: "Coconut Jelly", price: 0.75 },
  { id: "popping", label: "Lychee Popping Boba", price: 0.75 },
  { id: "pudding", label: "Egg Pudding", price: 0.75 },
  { id: "grass", label: "Grass Jelly", price: 0.75 },
  { id: "red-bean", label: "Red Bean", price: 0.75 },
];

const TAG_CONFIG = {
  bestseller: { label: "Bestseller", className: "bg-amber-100 text-amber-800 border-amber-200" },
  new: { label: "New", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  special: { label: "Special", className: "bg-rose-100 text-rose-800 border-rose-200" },
};

const DEFAULT_CUSTOMIZATIONS: Customizations = {
  size: "M",
  sugar: "50%",
  ice: "Regular",
  toppings: [],
};

// ── Order status ──────────────────────────────────────────────────────────────
const ORDER_STEPS = [
  { status: "placed", label: "Order Placed", icon: CheckCircle2, desc: "We've received your order!" },
  { status: "preparing", label: "Preparing", icon: CupSoda, desc: "Your drinks are being crafted" },
  { status: "ready", label: "Ready for Pickup", icon: Sparkles, desc: "Your boba is ready! 🎉" },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcLinePrice(item: MenuItem, custom: Customizations, qty: number) {
  const toppingCost = custom.toppings.length * 0.75;
  const sizeCost = SIZE_EXTRA[custom.size];
  return (item.price + toppingCost + sizeCost) * qty;
}

let cartIdCounter = 0;

// ── Main Component ────────────────────────────────────────────────────────────
export default function Index() {
  const [activeCategory, setActiveCategory] = useState("milk-tea");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customizeItem, setCustomizeItem] = useState<MenuItem | null>(null);
  const [customizations, setCustomizations] = useState<Customizations>({ ...DEFAULT_CUSTOMIZATIONS });
  const [quantity, setQuantity] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderView, setOrderView] = useState(false);
  const [orderStatus, setOrderStatus] = useState<"placed" | "preparing" | "ready">("placed");
  const [orderNumber] = useState(() => Math.floor(1000 + Math.random() * 9000));

  const filteredMenu = MENU.filter((m) => m.category === activeCategory);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.linePrice, 0);

  // Simulate order progression
  useEffect(() => {
    if (!orderView) return;
    setOrderStatus("placed");
    const t1 = setTimeout(() => setOrderStatus("preparing"), 3000);
    const t2 = setTimeout(() => setOrderStatus("ready"), 7000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [orderView]);

  function openCustomize(item: MenuItem) {
    setCustomizeItem(item);
    setCustomizations({ ...DEFAULT_CUSTOMIZATIONS });
    setQuantity(1);
  }

  function toggleTopping(id: string) {
    setCustomizations((prev) => ({
      ...prev,
      toppings: prev.toppings.includes(id)
        ? prev.toppings.filter((t) => t !== id)
        : [...prev.toppings, id],
    }));
  }

  function addToCart() {
    if (!customizeItem) return;
    const lp = calcLinePrice(customizeItem, customizations, quantity);
    const cartItem: CartItem = {
      id: `ci-${++cartIdCounter}`,
      menuItem: customizeItem,
      quantity,
      customizations: { ...customizations },
      linePrice: lp,
    };
    setCart((prev) => [...prev, cartItem]);
    setCustomizeItem(null);
    toast.success(`${customizeItem.name} added to cart`, {
      description: `${customizations.size} · ${customizations.sugar} sugar · ${customizations.ice}`,
    });
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }

  function placeOrder() {
    setCartOpen(false);
    setCart([]);
    setOrderView(true);
  }

  const previewPrice = customizeItem
    ? calcLinePrice(customizeItem, customizations, quantity)
    : 0;

  // ── Order tracking view ────────────────────────────────────────────────────
  if (orderView) {
    const currentStep = ORDER_STEPS.findIndex((s) => s.status === orderStatus);
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8 animate-fade-in-safe">
          <div className="text-center space-y-1">
            <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase">Nu Sirop</p>
            <h1 className="text-3xl font-bold tracking-tight">Order #{orderNumber}</h1>
            <p className="text-muted-foreground">Est. pickup in 12–15 min</p>
          </div>

          {/* Status steps */}
          <Card className="panel-surface p-6">
            <div className="space-y-6">
              {ORDER_STEPS.map((step, idx) => {
                const isActive = idx === currentStep;
                const isDone = idx < currentStep;
                return (
                  <div key={step.status} className="flex items-start gap-4">
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                      isDone ? "border-primary bg-primary text-primary-foreground"
                      : isActive ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground"
                    }`}>
                      <step.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 pt-1">
                      <p className={`font-semibold text-sm ${!isDone && !isActive ? "text-muted-foreground" : "text-foreground"}`}>
                        {step.label}
                      </p>
                      {isActive && (
                        <p className="text-xs text-muted-foreground mt-0.5 animate-fade-in-safe">{step.desc}</p>
                      )}
                    </div>
                    {isActive && (
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                    {isDone && (
                      <CheckCircle2 className="mt-1 h-4 w-4 text-primary" />
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {orderStatus === "ready" && (
            <Card className="panel-surface border-primary/30 bg-primary/5 p-5 text-center space-y-2 animate-scale-in-safe">
              <p className="text-2xl">🧋✨</p>
              <p className="font-semibold">Your boba is ready!</p>
              <p className="text-sm text-muted-foreground">Please pick up at the counter. Enjoy!</p>
            </Card>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => { setOrderView(false); setOrderStatus("placed"); }}
          >
            Order Again
          </Button>
        </div>
      </div>
    );
  }

  // ── Main ordering view ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-bold shadow-sm">
              🧋
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none tracking-tight">Nu Sirop</h1>
              <p className="text-xs text-muted-foreground leading-none mt-0.5">Bubble Tea & More</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="relative gap-2 rounded-full px-4"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Button>
        </div>

        {/* Category tabs */}
        <div className="mx-auto max-w-5xl px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Menu grid */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMenu.map((item) => (
            <Card
              key={item.id}
              className="panel-surface group cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
              onClick={() => openCustomize(item)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {item.tag && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 font-semibold ${TAG_CONFIG[item.tag].className}`}
                        >
                          {item.tag === "bestseller" && <Star className="h-2.5 w-2.5 mr-0.5" />}
                          {TAG_CONFIG[item.tag].label}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm leading-snug">{item.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                  <div className="text-3xl shrink-0">{item.emoji}</div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="font-bold text-base">${item.price.toFixed(2)}</span>
                  <Button
                    size="sm"
                    className="h-7 w-7 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); openCustomize(item); }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Customize dialog */}
      <Dialog open={!!customizeItem} onOpenChange={(o) => !o && setCustomizeItem(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span className="text-2xl">{customizeItem?.emoji}</span>
              {customizeItem?.name}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">{customizeItem?.description}</p>
          </DialogHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-5 py-2">
              {/* Size */}
              <div>
                <p className="text-sm font-semibold mb-2">Size</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["M", "L"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setCustomizations((p) => ({ ...p, size: s }))}
                      className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                        customizations.size === s
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/40 hover:bg-accent"
                      }`}
                    >
                      {s === "M" ? "Medium (M)" : `Large (L) +$${SIZE_EXTRA.L.toFixed(2)}`}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Sugar */}
              <div>
                <p className="text-sm font-semibold mb-2">Sugar Level</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {(["0%", "25%", "50%", "75%", "100%"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setCustomizations((p) => ({ ...p, sugar: s }))}
                      className={`rounded-lg border py-2 text-xs font-medium transition-all ${
                        customizations.sugar === s
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/40 hover:bg-accent"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Ice */}
              <div>
                <p className="text-sm font-semibold mb-2">Ice Level</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["No Ice", "Less Ice", "Regular", "Extra Ice"] as const).map((ice) => (
                    <button
                      key={ice}
                      onClick={() => setCustomizations((p) => ({ ...p, ice }))}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                        customizations.ice === ice
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/40 hover:bg-accent"
                      }`}
                    >
                      {ice}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Toppings */}
              <div>
                <p className="text-sm font-semibold mb-2">
                  Toppings <span className="text-muted-foreground font-normal">(+$0.75 each)</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {TOPPINGS_LIST.map((t) => {
                    const selected = customizations.toppings.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        onClick={() => toggleTopping(t.id)}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                          selected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/40 hover:bg-accent"
                        }`}
                      >
                        <span>{t.label}</span>
                        {selected && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Quantity */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Quantity</p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-6 text-center font-semibold tabular-nums">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="pt-4 border-t border-border">
            <Button className="w-full gap-2 h-11 text-base font-semibold" onClick={addToCart}>
              <Plus className="h-4 w-4" />
              Add to Cart — ${previewPrice.toFixed(2)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cart sheet */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="flex flex-col w-full sm:max-w-md p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" /> Your Order
              {cartCount > 0 && (
                <Badge variant="secondary" className="ml-auto">{cartCount} item{cartCount !== 1 ? "s" : ""}</Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
              <div className="text-5xl">🧋</div>
              <p className="font-semibold text-lg">Your cart is empty</p>
              <p className="text-sm text-muted-foreground">Add some drinks to get started!</p>
              <Button variant="outline" onClick={() => setCartOpen(false)}>Browse Menu</Button>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 px-6 py-4">
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-3 rounded-xl border border-border/70 bg-card p-3">
                      <span className="text-2xl shrink-0">{item.menuItem.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm leading-snug">{item.menuItem.name}</p>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.customizations.size} · {item.customizations.sugar} sugar · {item.customizations.ice}
                          {item.customizations.toppings.length > 0 && ` · ${item.customizations.toppings.length} topping${item.customizations.toppings.length > 1 ? "s" : ""}`}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                          <span className="font-semibold text-sm">${item.linePrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="border-t border-border px-6 py-5 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax (8%)</span>
                    <span>${(cartTotal * 0.08).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span>${(cartTotal * 1.08).toFixed(2)}</span>
                  </div>
                </div>
                <Button className="w-full h-11 gap-2 text-base font-semibold" onClick={placeOrder}>
                  Place Order <ChevronRight className="h-4 w-4" />
                </Button>
                <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" /> Est. 12–15 min pickup time
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

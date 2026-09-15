import { FormEvent, useState } from 'react';
import { ArrowDown, ArrowRight, Check, ChevronLeft, ChevronRight, Minus, Plus, Menu, Music2, Send, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { legalInfo } from '@/config/legal';
import ZoomModal from '@/components/ZoomModal';

type Collection = 'ЖЫВЕЛЫ' | 'ПТУШКІ' | 'ПРЫРОДА' | 'АРХІТЭКТУРА';

const mammalNames: string[] = [
  'ЗУБР', 'МЯДЗВЕДЗЬ', 'ЛОСЬ', 'АЛЕНЬ', 'ВОЎК', 'РЫСЬ', 'ЛІСА', 'БАРСУК',
  'ПАРТРЭТ ЗУБРА', 'ПАРТРЭТ МЯДЗВЕДЗЯ', 'ПАРТРЭТ ЛОСЯ', 'ПАРТРЭТ АЛЕНЯ',
  'ПАРТРЭТ ВОЎКА', 'ПАРТРЭТ РЫСІ', 'ПАРТРЭТ ЛІСЫ', 'ПАРТРЭТ БАРСУКА',
];

const birdNames: string[] = [
  'БЕЛЫ БУСЕЛ', 'ЧОРНЫ БУСЕЛ', 'АРОЛ', 'САВА', 'ГЛУШЭЦ', 'ЗІМАРОДАК',
  'ВЕРАЦЕННІК', 'ЛАСТАЎКА',
  'ПАРТРЭТ БЕЛАГА БУСЛА', 'ПАРТРЭТ ЧОРНАГА БУСЛА', 'ПАРТРЭТ АРЛА',
  'ПАРТРЭТ САВЫ', 'ПАРТРЭТ ГЛУШЦА', 'ПАРТРЭТ ЗІМАРОДКА',
  'ПАРТРЭТ ВЕРАЦЕННІКА', 'ПАРТРЭТ ЛАСТАЎКІ',
];

const PRICE_LARGE = 54;
const PRICE_SMALL = 45;

type PrintType = 'large' | 'small';

const createTshirtProducts = (names: string[], collection: Collection, imageDir: string, smallDir: string) =>
  names.map((name, i) => {
    const mark = String(i + 1).padStart(2, '0');
    return {
      name,
      type: '190г/м²',
      material: '100% полугребенной хлопок Ringspun',
      price: PRICE_LARGE,
      priceSmall: PRICE_SMALL,
      tone: 'bone',
      mark,
      image: `/images/tshirts/animals/${imageDir}/tshirt-${mark}-l.png`,
      imageSmall: `/images/tshirts/animals/${smallDir}/tshirt-${mark}-s.png`,
      category: 'tshirts' as const,
      collection,
    };
  });

const products = [
  ...createTshirtProducts(mammalNames, 'ЖЫВЕЛЫ', 'mammals', 'small-mammals'),
  ...createTshirtProducts(birdNames, 'ПТУШКІ', 'birds', 'small-birds'),
];

const hoodies = [
  { name: 'СВОБОДНЫЙ ХОД', type: 'хлопок', material: '100% полугребенной хлопок Ringspun', price: 119, tone: 'bone', mark: '01', image: '/images/hoodie/hoodie-01.png', category: 'hoodies' as const, collection: 'ЖЫВЕЛЫ' as Collection },
  { name: 'ТВОЕ НАПРАВЛЕНИЕ', type: 'хлопок', material: '100% полугребенной хлопок Ringspun', price: 119, tone: 'bone', mark: '02', image: '/images/hoodie/hoodie-02.png', category: 'hoodies' as const, collection: 'ЖЫВЕЛЫ' as Collection },
  { name: 'МЕСТО СИЛЫ', type: 'хлопок', material: '100% полугребенной хлопок Ringspun', price: 119, tone: 'bone', mark: '03', image: '/images/hoodie/hoodie-03.png', category: 'hoodies' as const, collection: 'ЖЫВЕЛЫ' as Collection },
  { name: 'ЦИФРОВОЙ СЛЕД', type: 'хлопок', material: '100% полугребенной хлопок Ringspun', price: 119, tone: 'bone', mark: '04', image: '/images/hoodie/hoodie-04.png', category: 'hoodies' as const, collection: 'ЖЫВЕЛЫ' as Collection },
];

const tshirtSizes = ['XS', 'S', 'M', 'L'] as const;
const hoodieSizes = ['XS', 'S', 'M', 'L'] as const;
type Size = (typeof tshirtSizes)[number] | (typeof hoodieSizes)[number];
type Product = (typeof products)[number] | (typeof hoodies)[number];
type CartItem = { id: string; product: Product; size: Size; quantity: number; printType: PrintType; unitPrice: number };

type FormState = {
  fullName: string;
  phone: string;
  email: string;
  telegram: string;
  pickupPoint: string;
  shippingMethod: string;
};

const initialForm: FormState = {
  fullName: '',
  phone: '',
  email: '',
  telegram: '',
  pickupPoint: '',
  shippingMethod: 'Европочта',
};

const formatPrice = (amount: number) => `${amount} BYN`;

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [cardSizes, setCardSizes] = useState<Record<string, Size>>({});
  const [cardQuantities, setCardQuantities] = useState<Record<string, number>>({});
  const [cardPrintTypes, setCardPrintTypes] = useState<Record<string, PrintType>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [expandedProduct, setExpandedProduct] = useState<Product | null>(null);
  const [paramsProduct, setParamsProduct] = useState<Product | null>(null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [addedProduct, setAddedProduct] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tshirts' | 'hoodies'>('tshirts');
  const [activeCollection, setActiveCollection] = useState<Collection>('ЖЫВЕЛЫ');

  const collections: Collection[] = ['ЖЫВЕЛЫ', 'ПТУШКІ', 'ПРЫРОДА', 'АРХІТЭКТУРА'];

  const activeProducts = activeTab === 'tshirts'
    ? products.filter((p) => p.collection === activeCollection)
    : hoodies.filter((p) => p.collection === activeCollection);

  const activeCollectionCount = activeTab === 'tshirts'
    ? products.filter((p) => p.collection === activeCollection).length
    : hoodies.filter((p) => p.collection === activeCollection).length;
  const sizeGuideImage = activeTab === 'tshirts' ? '/images/tshirts/tshirt-size-chart.png' : '/images/hoodie/hoodies-size-table.png';
  const sizeHints = activeTab === 'tshirts' ? ['48', '50', '52–54', '56'] : ['44–46', '46–48', '48–50', '52–54'];
  const activeSizes = activeTab === 'tshirts' ? tshirtSizes : hoodieSizes;

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const getCardSize = (product: Product): Size => cardSizes[product.name] ?? 'M';

  const toggleCardPrintType = (product: Product) => {
    setCardPrintTypes((current) => ({ ...current, [product.name]: getCardPrintType(product) === 'large' ? 'small' : 'large' }));
  };
  const getCardQuantity = (product: Product): number => cardQuantities[product.name] ?? 1;
  const getCardPrintType = (product: Product): PrintType => cardPrintTypes[product.name] ?? 'large';
  const getCardPrice = (product: Product): number => {
    if (product.category !== 'tshirts') return product.price;
    return getCardPrintType(product) === 'large' ? product.price : product.priceSmall;
  };
  const getCardImage = (product: Product): string => {
    if (product.category !== 'tshirts') return product.image;
    return getCardPrintType(product) === 'large' ? product.image : product.imageSmall;
  };

  const changeCardQuantity = (product: Product, amount: number) => {
    const nextQuantity = Math.max(1, getCardQuantity(product) + amount);
    setCardQuantities((current) => ({ ...current, [product.name]: nextQuantity }));
  };

  const addToCart = (product: Product) => {
    const size = getCardSize(product);
    const quantity = getCardQuantity(product);
    const printType = getCardPrintType(product);
    const unitPrice = getCardPrice(product);
    const id = `${product.name}-${size}-${printType}`;

    setCart((current) => {
      const existing = current.find((item) => item.id === id);
      if (existing) {
        return current.map((item) => item.id === id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...current, { id, product, size, quantity, printType, unitPrice }];
    });
    setAddedProduct(product.name);
    window.setTimeout(() => setAddedProduct(null), 1800);
  };

  const updateCartQuantity = (id: string, amount: number) => {
    setCart((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + amount) } : item));
  };

  const removeFromCart = (id: string) => {
    setCart((current) => current.filter((item) => item.id !== id));
  };

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const productsTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const deliveryCost = totalQuantity === 1 ? 5 : 0;
  const orderTotal = productsTotal + deliveryCost;

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (cart.length === 0) {
      setError('Добавьте хотя бы одну вещь в корзину.');
      return;
    }

    setIsSending(true);
    const telegram = form.telegram.trim() || 'Не заполнялось';
    const productSummary = cart.map((item) => {
      const printLabel = item.printType === 'large' ? 'крупный принт' : 'мелкий принт';
      return `${item.product.name} — ${item.size}, ${printLabel}, ${item.quantity} шт., ${formatPrice(item.unitPrice)}/шт.`;
    }).join('\n');
    const sizeSummary = cart.map((item) => `${item.product.name}: ${item.size}`).join('; ');


    if (supabase) {
      const { error: insertError } = await supabase.from('mezha_orders').insert({
        full_name: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        telegram,
        size: sizeSummary,
        pickup_point: form.pickupPoint.trim(),
        shipping_method: form.shippingMethod,
        product: productSummary,
      });

      if (insertError) {
        setError('Не удалось отправить заявку. Попробуйте ещё раз или напишите нам в Telegram.');
        setIsSending(false);
        return;
      }
    }

    const emailjsConfig = {
      serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_x3wyi1k',
      templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_ydqe5rm',
      publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'D6P-fI_Auhb_jUPjg',
    };

    if (!emailjsConfig.serviceId || !emailjsConfig.templateId || !emailjsConfig.publicKey) {
      setError('Заявка сохранена, но EmailJS ещё не подключён.');
      setIsSending(false);
      return;
    }

    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: emailjsConfig.serviceId,
          template_id: emailjsConfig.templateId,
          user_id: emailjsConfig.publicKey,
          template_params: {
            to_email: 'mezha.mail@gmail.com',
            product: productSummary,
            size: sizeSummary,
            quantity: totalQuantity,
            full_name: form.fullName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            telegram,
            pickup_point: form.pickupPoint.trim(),
            delivery_method: form.shippingMethod,
            products_total: formatPrice(productsTotal),
            delivery_cost: formatPrice(deliveryCost),
            order_total: formatPrice(orderTotal),
          },
        }),
      });

      if (!response.ok) {
        setError('Заявка сохранена, но письмо не отправилось. Проверьте настройки EmailJS.');
        setIsSending(false);
        return;
      }
    } catch {
      setError('Заявка сохранена, но письмо не отправилось. Проверьте подключение к EmailJS.');
      setIsSending(false);
      return;
    }

    setSubmitted(true);
    setForm(initialForm);
    setCart([]);
    setIsSending(false);
  };

  const productTotalLabel = activeCollectionCount;

  return (
    <main>
      <nav className="nav container">
        <a className="wordmark" href="#top" aria-label="МЕЖА — в начало">МЕЖА</a>
        <div className={`nav-links ${menuOpen ? 'is-open' : ''}`}>
          <a href="#about" onClick={() => setMenuOpen(false)}>О бренде</a>
          <a href="#catalog" onClick={() => setMenuOpen(false)}>Каталог</a>
          <a href="#order" onClick={() => setMenuOpen(false)}>Корзина</a>
        </div>
        <a className="nav-order" href="#order">Корзина <ArrowRight size={16} /></a>
        <button className="menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label="Открыть меню">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      <section className="hero container" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span className="dot" /> белорусский streetwear · 2026</p>
          <h1>Одежда<br /><em>твоего</em><br />края.</h1>
          <p className="hero-text">МЕЖА — локальный бренд из Беларуси, созданный на стыке брутального минимализма и глубоких смыслов. Форма для тех, кто не боится очерчивать свои границы.</p>
          <a className="button button-dark" href="#catalog">Смотреть вещи <ArrowDown size={17} /></a>
        </div>
        <div className="hero-art">
          <div className="hero-art-top"><span>МЕЖА / 01</span><span>Беларусь</span></div>
          <img src="/images/logo.png" alt="Логотип бренда МЕЖА" />
          <div className="hero-art-bottom"><span>KEEP YOUR LINE</span><span>53°31′45″ N / 28°02′42″ E</span></div>
          <div className="art-cross cross-one" /><div className="art-cross cross-two" />
        </div>
      </section>

      <div className="ticker" aria-label="МЕЖА — держи свою линию"><div className="ticker-track">МЕЖА <span>•</span> ОДЕЖДА ТВОЕГО КРАЯ <span>•</span> БЕЛАРУСЬ <span>•</span> МЕЖА <span>•</span> ОДЕЖДА ТВОЕГО КРАЯ <span>•</span> БЕЛАРУСЬ <span>•</span></div></div>

      <section className="about container" id="about">
        <div className="section-label"><span>01</span><span>О бренде</span></div>
        <div className="about-grid"><h2>Одежда —<br /><span>это позиция.</span></h2><div className="about-copy"><p>Мы создаём вещи с внутренним стержнем. МЕЖА говорит о границах, которые мы проводим сами — и о смелости их двигать.</p><p>Каждая коллекция собрана в Беларуси небольшими тиражами. Мы не гонимся за скоростью. Мы за то, чтобы вещь осталась с тобой надолго.</p></div></div>
      </section>

      <section className="catalog container" id="catalog">
        <div className="section-heading"><div className="section-label"><span>02</span><span>Каталог / {productTotalLabel}</span></div><h2>Вещи<br /><em>с характером.</em></h2><p>Базовая форма. Нестандартная мысль.</p></div>
        <div className="catalog-tabs">
          <button className={activeTab === 'tshirts' ? 'active' : ''} onClick={() => setActiveTab('tshirts')}>ФУТБОЛКИ</button>
          <button className={activeTab === 'hoodies' ? 'active' : ''} onClick={() => setActiveTab('hoodies')}>ТОЛСТОВКИ</button>
        </div>
        <div className="collection-tabs">
          {collections.map((col) => (
            <button key={col} className={activeCollection === col ? 'active' : ''} onClick={() => setActiveCollection(col)}>{col}</button>
          ))}
        </div>
        <div className="product-grid">
          {activeProducts.map((product) => {
            return <article className="product-card" key={`${product.category}-${product.name}`}>
              <div className="product-image" onClick={() => setExpandedProduct(product)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setExpandedProduct(product); } }} role="button" tabIndex={0} aria-label={`Рассмотреть ${activeTab === 'tshirts' ? 'майку' : 'толстовку'} ${product.name}`}>
                <img className="product-photo" src={getCardImage(product)} alt={`${activeTab === 'tshirts' ? 'Майка' : 'Толстовка'} ${product.name}`} />
                <span className="product-number">{product.mark} / {String(activeCollectionCount).padStart(2, '0')}</span><span className="product-stamp">МЕЖА<br />MADE IN BY</span><span className="zoom-hint">нажми, чтобы рассмотреть</span>
                {product.category === 'tshirts' && (
                  <>
                    <button className="card-nav-arrow card-nav-prev" type="button" onClick={(e) => { e.stopPropagation(); toggleCardPrintType(product); }} aria-label="Предыдущее фото"><ChevronLeft size={18} /></button>
                    <button className="card-nav-arrow card-nav-next" type="button" onClick={(e) => { e.stopPropagation(); toggleCardPrintType(product); }} aria-label="Следующее фото"><ChevronRight size={18} /></button>
                    <div className="card-print-toggle">
                      <button type="button" className={getCardPrintType(product) === 'large' ? 'active' : ''} onClick={(e) => { e.stopPropagation(); setCardPrintTypes((c) => ({ ...c, [product.name]: 'large' })); }} aria-label="Крупный принт">L</button>
                      <button type="button" className={getCardPrintType(product) === 'small' ? 'active' : ''} onClick={(e) => { e.stopPropagation(); setCardPrintTypes((c) => ({ ...c, [product.name]: 'small' })); }} aria-label="Мелкий принт">S</button>
                    </div>
                  </>
                )}
              </div>
              <div className="product-info"><div><h3>{product.name}</h3><p>{product.type}</p></div><strong>{formatPrice(getCardPrice(product))}</strong></div>
              <button className="product-choose" onClick={() => setParamsProduct(product)}>Выбрать параметры <ArrowRight size={16} /></button>
            </article>;
          })}
        </div>
        {activeProducts.length === 0 && (
          <div className="catalog-empty-tab">
            <p>Эта коллекция скоро появится.</p>
          </div>
        )}
        <p className="catalog-note">* Без учёта доставки (бесплатно при заказе от 2-х вещей).</p>
        <p className="catalog-sizes-note">** Размеры соответствуют стандартным белорусским. Если вы хотите, чтобы вещь сидела свободно (оверсайз), рекомендуем заказывать на один размер больше вашего привычного.</p>
      </section>

      <section className="size-guide container" id="sizes">
        <div className="size-guide-heading"><div className="section-label"><span>03</span><span>Размеры · {activeTab === 'tshirts' ? 'Футболки' : 'Толстовки'}</span></div><h2>Найди<br /><em>свой размер.</em></h2><p>Сними мерки по любимой вещи и сравни с таблицей. Для оверсайз-посадки выбирай размер по ширине изделия под проймой.</p></div>
        <div className="size-guide-card"><img src={sizeGuideImage} alt={`Таблица размеров ${activeTab === 'tshirts' ? 'маек' : 'толстовок'} МЕЖА`} onClick={() => setSizeGuideOpen(true)} /><div className="size-guide-note"><span>РАЗМЕРЫ</span><strong>XS — {sizeHints[0]}<br />S — {sizeHints[1]}<br />M — {sizeHints[2]}<br />L — {sizeHints[3]}</strong><p>Измеряй вещь на ровной поверхности.</p></div></div>
      </section>

      <section className="manifesto container"><div className="manifesto-line" /><p>НЕ ИЩИ<br /><span>СВОЁ МЕСТО.</span><br />СОЗДАЙ ЕГО.</p><span className="manifesto-mark">М / 2026</span></section>

      <section className="order-section container" id="order">
        <div className="order-intro"><div className="section-label"><span>04</span><span>Заказ</span></div><h2>Вещь<br /><em>тебе.</em></h2><p>Заполните форму — мы изготовим ваш заказ и передадим его в службу доставки в течение 5–7 рабочих дней. Номер для отслеживания посылки придет вам на электронную почту.</p></div>
        <div className="order-form-wrap">
          {submitted ? <div className="success-message"><div className="success-icon"><Check size={28} /></div><h3>Заявка принята.</h3><p>Спасибо. Мы уже получили твой заказ и напишем для подтверждения деталей.</p><button className="button button-dark" onClick={() => setSubmitted(false)}>Оформить ещё одну <ArrowRight size={17} /></button></div> : <form className="order-form" onSubmit={submitOrder}>
            <p className="required-note"><span>*</span> обязательные поля</p>
            <label><span>ФИО <b>*</b></span><input required value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} placeholder="Как к вам обращаться?" /></label>
            <div className="form-row"><label><span>ТЕЛЕФОН <b>*</b></span><input required type="tel" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="+375 (__) ___-__-__" /></label><label><span>ЭЛЕКТРОННАЯ ПОЧТА <b>*</b></span><input required type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="example@gmail.com" /></label></div><label><span>TELEGRAM</span><input value={form.telegram} onChange={(event) => updateField('telegram', event.target.value)} placeholder="Необязательно" /></label>
            <label><span>ОТДЕЛЕНИЕ ПОЧТЫ <b>*</b></span><input required value={form.pickupPoint} onChange={(event) => updateField('pickupPoint', event.target.value)} placeholder="Город, номер или адрес отделения" /></label>
            <fieldset><legend>СПОСОБ ДОСТАВКИ <b>*</b></legend><div className="shipping-options">{['Европочта', 'Белпочта'].map((shippingMethod) => <label className={form.shippingMethod === shippingMethod ? 'active' : ''} key={shippingMethod}><input type="radio" name="shippingMethod" value={shippingMethod} checked={form.shippingMethod === shippingMethod} onChange={(event) => updateField('shippingMethod', event.target.value)} />{shippingMethod}</label>)}</div></fieldset>
            <div className="cart-panel"><div className="cart-heading"><h3>Корзина</h3><span>{totalQuantity} шт.</span></div>{cart.length === 0 ? <p className="cart-empty">Добавьте вещи из каталога, чтобы оформить заказ.</p> : <div className="cart-items">{cart.map((item) => <div className="cart-item" key={item.id}><div><strong>{item.product.name}</strong><span>Размер {item.size}{item.printType === 'small' ? ' · мелкий принт' : ' · крупный принт'} · {formatPrice(item.unitPrice)} / шт.</span></div><div className="cart-item-actions"><div className="quantity-control"><button type="button" onClick={() => updateCartQuantity(item.id, -1)} aria-label="Уменьшить количество"><Minus size={13} /></button><strong>{item.quantity}</strong><button type="button" onClick={() => updateCartQuantity(item.id, 1)} aria-label="Увеличить количество"><Plus size={13} /></button></div><button className="remove-item" type="button" onClick={() => removeFromCart(item.id)}>Убрать</button></div></div>)}</div>}
              <div className="cart-summary"><div><span>ТОВАРЫ</span><strong>{formatPrice(productsTotal)}</strong></div><div className={deliveryCost === 0 && totalQuantity > 0 ? 'delivery-free' : ''}><span>ДОСТАВКА {deliveryCost === 0 && totalQuantity > 0 ? '(от 2-х вещей)' : ''}</span><strong className={deliveryCost === 0 && totalQuantity > 0 ? 'strikethrough' : ''}>{formatPrice(5)}</strong>{deliveryCost === 0 && totalQuantity > 0 && <em>БЕСПЛАТНО</em>}</div><div className="cart-total"><span>ИТОГО</span><strong>{formatPrice(orderTotal)}</strong></div></div>
            </div>
            {error && <p className="form-error">{error}</p>}
            <button className="submit-button" type="submit" disabled={isSending}>{isSending ? 'Отправляем…' : <>Оформить заказ <Send size={17} /></>}</button><p className="form-footnote">Нажимая кнопку, вы соглашаетесь на обработку данных для оформления заказа.</p>
          </form>}
        </div>
      </section>

      {sizeGuideOpen && <ZoomModal imageSrc={sizeGuideImage} imageAlt={`Таблица размеров ${activeTab === 'tshirts' ? 'маек' : 'толстовок'} МЕЖА — увеличенный просмотр`} title={`Таблица размеров · ${activeTab === 'tshirts' ? 'Футболки' : 'Толстовки'}`} onClose={() => setSizeGuideOpen(false)} />}
      {expandedProduct && <ZoomModal imageSrc={getCardImage(expandedProduct)} imageAlt={`${expandedProduct.name} — увеличенный просмотр`} subtitle={`${expandedProduct.mark} / ${String(activeCollectionCount).padStart(2, '0')}`} title={expandedProduct.name} onClose={() => setExpandedProduct(null)} />}
      {paramsProduct && (
        <div className="image-modal params-modal" role="dialog" aria-modal="true" aria-label={`Выбор параметров: ${paramsProduct.name}`} onClick={() => setParamsProduct(null)}>
          <div className="params-modal-content" onClick={(event) => event.stopPropagation()}>
            <button className="params-modal-close" onClick={() => setParamsProduct(null)} aria-label="Закрыть окно выбора параметров"><X size={21} /></button>
            <div className="params-modal-photo" onClick={() => setExpandedProduct(paramsProduct)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setExpandedProduct(paramsProduct); } }} aria-label={`Рассмотреть майку ${paramsProduct.name}`}>
              <img src={getCardImage(paramsProduct)} alt={`Майка ${paramsProduct.name}`} />
              {paramsProduct.category === 'tshirts' && (
                <>
                  <button className="card-nav-arrow card-nav-prev" type="button" onClick={(e) => { e.stopPropagation(); toggleCardPrintType(paramsProduct); }} aria-label="Предыдущее фото"><ChevronLeft size={18} /></button>
                  <button className="card-nav-arrow card-nav-next" type="button" onClick={(e) => { e.stopPropagation(); toggleCardPrintType(paramsProduct); }} aria-label="Следующее фото"><ChevronRight size={18} /></button>
                  <div className="print-toggle">
                    <button type="button" className={getCardPrintType(paramsProduct) === 'large' ? 'active' : ''} onClick={(e) => { e.stopPropagation(); setCardPrintTypes((c) => ({ ...c, [paramsProduct.name]: 'large' })); }} aria-label="Крупный принт">L</button>
                    <button type="button" className={getCardPrintType(paramsProduct) === 'small' ? 'active' : ''} onClick={(e) => { e.stopPropagation(); setCardPrintTypes((c) => ({ ...c, [paramsProduct.name]: 'small' })); }} aria-label="Мелкий принт">S</button>
                  </div>
                  <div className="print-label">{getCardPrintType(paramsProduct) === 'large' ? 'КРУПНЫЙ ПРИНТ' : 'МЕЛКИЙ ПРИНТ'}</div>
                </>
              )}
            </div>
            <div className="params-modal-side">
              <div className="params-modal-info">
                <span className="params-modal-mark">{paramsProduct.mark} / {String(activeCollectionCount).padStart(2, '0')}</span>
                <h3>{paramsProduct.name}</h3>
                <p>{paramsProduct.type}</p>
                <p className="params-modal-material">{paramsProduct.material}</p>
                <strong>{formatPrice(getCardPrice(paramsProduct))}</strong>
              </div>
              <div className="params-modal-options">
                <div className="product-size-picker">
                  <span>РАЗМЕР</span>
                  <div className="size-choice-row">
                    {activeSizes.map((size) => (
                      <button className={getCardSize(paramsProduct) === size ? 'active' : ''} key={size} type="button" onClick={() => setCardSizes((current) => ({ ...current, [paramsProduct.name]: size }))}>{size}</button>
                    ))}
                  </div>
                  <div className="size-hints">{activeSizes.map((size, i) => <span key={size}>{sizeHints[i]}</span>)}</div>
                </div>
                <div className="product-quantity">
                  <span>КОЛ-ВО</span>
                  <div>
                    <button type="button" onClick={() => changeCardQuantity(paramsProduct, -1)} aria-label="Уменьшить количество"><Minus size={13} /></button>
                    <strong>{getCardQuantity(paramsProduct)} шт.</strong>
                    <button type="button" onClick={() => changeCardQuantity(paramsProduct, 1)} aria-label="Увеличить количество"><Plus size={13} /></button>
                  </div>
                </div>
              </div>
              <button className="params-modal-add" onClick={() => { addToCart(paramsProduct); setParamsProduct(null); }}>Добавить в корзину <ArrowRight size={16} /></button>
            </div>
          </div>
        </div>
      )}
      {addedProduct && <div className="toast-notification"><Check size={16} /> <span>{addedProduct} добавлено в корзину</span></div>}
      <footer className="footer container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-brand-row">
              <div className="footer-brand-text">
                <a className="wordmark" href="#top">МЕЖА</a>
                <p>ОДЕЖДА ТВОЕГО КРАЯ.</p>
              </div>
              <div className="footer-links"><a href="https://t.me/moi_angel" aria-label="Telegram"><Send size={17} /></a><a href="https://www.tiktok.com/@shop.mezha" aria-label="TikTok"><Music2 size={17} /></a></div>
            </div>
          </div>
          <div className="footer-contacts">
            <h4>КОНТАКТЫ</h4>
            <a href={`mailto:${legalInfo.email}`}>Почта: {legalInfo.email}</a>
            <a href="tel:+375298406458">Телефон: {legalInfo.phone}</a>
          </div>
        </div>
        <span className="footer-copy">© 2026 МЕЖА</span>
        <div className="legal-details">
          <p>{legalInfo.entrepreneur}, {legalInfo.country}, {legalInfo.city}, {legalInfo.address}, {legalInfo.phone}</p>
          <p>УНП {legalInfo.unp} от {legalInfo.unpDate} выдано {legalInfo.unpIssuedBy}, тел. Климовичский РИК: {legalInfo.rikPhone}</p>
          <p>Интернет-магазин зарегистрирован в Торговом реестре Республики Беларусь: № {legalInfo.tradeRegisterNumber} от {legalInfo.tradeRegisterDate}. Адрес для почтовых отправлений: {legalInfo.postalAddress}.</p>
          <p>Режим работы: {legalInfo.workingHours}.</p>
        </div>
      </footer>
    </main>
  );
}

export default App;

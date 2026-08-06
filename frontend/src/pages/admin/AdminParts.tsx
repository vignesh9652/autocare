import { useState, type FormEvent } from 'react';
import { Package, Plus } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Badge, { type BadgeVariant } from '@/components/ui/Badge';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import Skeleton from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useApiData } from '@/hooks/useApiData';
import { getParts, createPart } from '@/api/sparePartsApi';
import type { SparePart, SparePartRequest } from '@/types';
import { formatCurrency } from '@/utils/format';

type StockStatus = 'IN STOCK' | 'LOW STOCK' | 'OUT OF STOCK';

const STATUS_VARIANT: Record<StockStatus, BadgeVariant> = {
  'IN STOCK': 'success',
  'LOW STOCK': 'warning',
  'OUT OF STOCK': 'danger',
};

function stockStatus(stock: number): StockStatus {
  return stock <= 0 ? 'OUT OF STOCK' : stock < 15 ? 'LOW STOCK' : 'IN STOCK';
}

interface PartForm {
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
}

const EMPTY_FORM: PartForm = { name: '', category: 'Filters', price: 0, stock: 0, description: '' };

export default function AdminParts() {
  const parts = useApiData(() => getParts(), []);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<PartForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  const rows = parts.data ?? [];

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.price <= 0) return;
    setSaving(true);
    try {
      const payload: SparePartRequest = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: form.price,
        stockQuantity: form.stock,
        category: form.category,
        compatibleVehicleModels: [],
      };
      await createPart(payload);
      success('Product added', `${form.name} added to inventory.`);
      setFormOpen(false);
      parts.refresh();
    } catch (err) {
      error('Could not add product', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const columns: DataTableColumn<SparePart>[] = [
    { key: 'name', header: 'Product', render: (p) => (
      <div>
        <p className="font-medium text-slate-800 dark:text-slate-100">{p.name}</p>
        <p className="text-xs text-slate-400">{p.category}</p>
      </div>
    ) },
    { key: 'stock', header: 'Stock', render: (p) => {
      const status = stockStatus(p.stockQuantity);
      return (
        <div>
          <p className="font-bold text-slate-800 dark:text-slate-100">{p.stockQuantity} units</p>
          <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className={`h-full rounded-full ${status === 'IN STOCK' ? 'bg-emerald-500' : status === 'LOW STOCK' ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(100, p.stockQuantity * 2)}%` }}
            />
          </div>
        </div>
      );
    } },
    { key: 'price', header: 'Price', render: (p) => <span className="font-bold text-slate-800 dark:text-slate-100">{formatCurrency(p.price)}</span> },
    { key: 'category', header: 'Category', hideBelow: 'md', render: (p) => <span className="text-slate-500 dark:text-slate-400">{p.category}</span> },
    { key: 'compat', header: 'Compatible models', hideBelow: 'lg', render: (p) => (
      <span className="text-slate-600 dark:text-slate-300">{p.compatibleVehicleModels.length} model{p.compatibleVehicleModels.length === 1 ? '' : 's'}</span>
    ) },
    { key: 'status', header: 'Status', render: (p) => <Badge variant={STATUS_VARIANT[stockStatus(p.stockQuantity)]} dot>{stockStatus(p.stockQuantity)}</Badge> },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Spare Parts Inventory"
        subtitle={`${rows.filter((p) => stockStatus(p.stockQuantity) !== 'IN STOCK').length} products need attention`}
        icon={<Package className="h-5 w-5" />}
        actions={<Button onClick={openAdd}><Plus className="h-4 w-4" /> Add Product</Button>}
      />

      {parts.loading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          rowKey={(p) => p.id}
          searchable
          searchPlaceholder="Search products…"
          searchFilter={(p, q) => [p.name, p.category].some((v) => v.toLowerCase().includes(q))}
          emptyTitle="No products found"
          emptyDescription="Add products to build your inventory."
        />
      )}

      {/* Add product modal */}
      <Modal
        open={formOpen}
        title="Add Product"
        onClose={() => setFormOpen(false)}
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" form="part-form" disabled={saving}>{saving ? 'Saving…' : 'Add Product'}</Button>
          </>
        }
      >
        <form id="part-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Product name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div>
              <label className="label">Category</label>
              <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option>Lubricants</option><option>Filters</option><option>Brakes</option><option>Electrical</option><option>Tyres</option><option>Accessories</option>
              </select>
            </div>
          </div>
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Price (₹)" type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            <Input label="Stock" type="number" required value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
          </div>
        </form>
      </Modal>
    </div>
  );
}

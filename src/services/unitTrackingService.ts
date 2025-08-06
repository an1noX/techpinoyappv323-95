import { supabase } from '@/integrations/supabase/client';
import {
  PurchaseOrderItemUnit,
  DeliveryItemUnit,
  UnitDeliveryLink,
  PurchaseOrderItemUnitWithDetails,
  DeliveryItemUnitWithDetails,
  UnitDeliveryLinkWithDetails,
  CreatePurchaseOrderItemUnitData,
  UpdatePurchaseOrderItemUnitData,
  CreateDeliveryItemUnitData,
  UpdateDeliveryItemUnitData,
  CreateUnitDeliveryLinkData,
  UpdateUnitDeliveryLinkData,
  BulkCreateUnitLinksData,
  UnitLinkingValidation,
  UnitTrackingStats,
  UnitSearchCriteria,
  UnitReconciliationReport
} from '@/types/unitTracking';

export const unitTrackingService = {
  // Purchase Order Item Units
  async createPurchaseOrderItemUnit(unitData: CreatePurchaseOrderItemUnitData): Promise<PurchaseOrderItemUnit> {
    const { data, error } = await supabase
      .from('purchase_order_item_units')
      .insert(unitData)
      .select()
      .single();

    if (error) throw error;
    return data as PurchaseOrderItemUnit;
  },

  async updatePurchaseOrderItemUnit(unitData: UpdatePurchaseOrderItemUnitData): Promise<PurchaseOrderItemUnit> {
    const { id, ...updates } = unitData;
    const { data, error } = await supabase
      .from('purchase_order_item_units')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as PurchaseOrderItemUnit;
  },

  async getPurchaseOrderItemUnits(purchaseOrderItemId: string): Promise<PurchaseOrderItemUnitWithDetails[]> {
    const { data, error } = await supabase
      .from('purchase_order_item_units')
      .select(`
        *,
        purchase_order_item:purchase_order_items(
          id,
          purchase_order_id,
          product_id,
          model,
          quantity,
          unit_price
        ),
        unit_links:unit_delivery_links(
          *,
          delivery_unit:delivery_item_units(*)
        )
      `)
      .eq('purchase_order_item_id', purchaseOrderItemId)
      .order('unit_number');

    if (error) throw error;
    return (data || []) as unknown as PurchaseOrderItemUnitWithDetails[];
  },

  async getPurchaseOrderItemUnitById(unitId: string): Promise<PurchaseOrderItemUnitWithDetails | null> {
    const { data, error } = await supabase
      .from('purchase_order_item_units')
      .select(`
        *,
        purchase_order_item:purchase_order_items(
          id,
          purchase_order_id,
          product_id,
          model,
          quantity,
          unit_price
        ),
        unit_links:unit_delivery_links(
          *,
          delivery_unit:delivery_item_units(*)
        )
      `)
      .eq('id', unitId)
      .single();

    if (error) throw error;
    return data as unknown as PurchaseOrderItemUnitWithDetails;
  },

  // Delivery Item Units
  async createDeliveryItemUnit(unitData: CreateDeliveryItemUnitData): Promise<DeliveryItemUnit> {
    const { data, error } = await supabase
      .from('delivery_item_units')
      .insert(unitData)
      .select()
      .single();

    if (error) throw error;
    return data as DeliveryItemUnit;
  },

  async updateDeliveryItemUnit(unitData: UpdateDeliveryItemUnitData): Promise<DeliveryItemUnit> {
    const { id, ...updates } = unitData;
    const { data, error } = await supabase
      .from('delivery_item_units')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DeliveryItemUnit;
  },

  async getDeliveryItemUnits(deliveryItemId: string): Promise<DeliveryItemUnitWithDetails[]> {
    const { data, error } = await supabase
      .from('delivery_item_units')
      .select(`
        *,
        delivery_item:delivery_items(
          id,
          delivery_id,
          product_id,
          quantity_delivered
        ),
        unit_links:unit_delivery_links(
          *,
          purchase_order_unit:purchase_order_item_units(*)
        )
      `)
      .eq('delivery_item_id', deliveryItemId)
      .order('unit_number');

    if (error) throw error;
    return (data || []) as unknown as DeliveryItemUnitWithDetails[];
  },

  async getDeliveryItemUnitById(unitId: string): Promise<DeliveryItemUnitWithDetails | null> {
    const { data, error } = await supabase
      .from('delivery_item_units')
      .select(`
        *,
        delivery_item:delivery_items(
          id,
          delivery_id,
          product_id,
          quantity_delivered
        ),
        unit_links:unit_delivery_links(
          *,
          purchase_order_unit:purchase_order_item_units(*)
        )
      `)
      .eq('id', unitId)
      .single();

    if (error) throw error;
    return data as unknown as DeliveryItemUnitWithDetails;
  },

  // Unit Delivery Links
  async createUnitDeliveryLink(linkData: CreateUnitDeliveryLinkData): Promise<UnitDeliveryLink> {
    const { data, error } = await supabase
      .from('unit_delivery_links')
      .insert(linkData)
      .select()
      .single();

    if (error) throw error;
    return data as UnitDeliveryLink;
  },

  async createBulkUnitLinks(bulkData: BulkCreateUnitLinksData): Promise<UnitDeliveryLink[]> {
    const { data, error } = await supabase
      .from('unit_delivery_links')
      .insert(bulkData.links)
      .select();

    if (error) throw error;
    return (data || []) as UnitDeliveryLink[];
  },

  async updateUnitDeliveryLink(linkData: UpdateUnitDeliveryLinkData): Promise<UnitDeliveryLink> {
    const { id, ...updates } = linkData;
    const { data, error } = await supabase
      .from('unit_delivery_links')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as UnitDeliveryLink;
  },

  async deleteUnitDeliveryLink(linkId: string): Promise<void> {
    const { error } = await supabase
      .from('unit_delivery_links')
      .delete()
      .eq('id', linkId);

    if (error) throw error;
  },

  async getUnitDeliveryLinks(purchaseOrderId?: string, deliveryId?: string): Promise<UnitDeliveryLinkWithDetails[]> {
    let query = supabase
      .from('unit_delivery_links')
      .select(`
        *,
        purchase_order_unit:purchase_order_item_units(
          *,
          purchase_order_item:purchase_order_items(
            *,
            purchase_order:purchase_orders(id, client_po, supplier_name)
          )
        ),
        delivery_unit:delivery_item_units(
          *,
          delivery_item:delivery_items(
            *,
            delivery:deliveries(id, delivery_receipt_number, delivery_date)
          )
        )
      `);

    if (purchaseOrderId) {
      query = query.eq('purchase_order_unit.purchase_order_item.purchase_order_id', purchaseOrderId);
    }

    if (deliveryId) {
      query = query.eq('delivery_unit.delivery_item.delivery_id', deliveryId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as UnitDeliveryLinkWithDetails[];
  },

  // Validation and Search
  async validateUnitLinking(
    purchaseOrderUnitId: string,
    deliveryUnitId: string
  ): Promise<UnitLinkingValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Get both units with details
      const [poUnit, deliveryUnit] = await Promise.all([
        this.getPurchaseOrderItemUnitById(purchaseOrderUnitId),
        this.getDeliveryItemUnitById(deliveryUnitId)
      ]);

      if (!poUnit) {
        errors.push('Purchase order unit not found');
        return {
          valid: false,
          errors,
          warnings,
          po_unit_available: false,
          delivery_unit_available: false,
          serial_match: false,
          batch_match: false,
          product_match: false
        };
      }

      if (!deliveryUnit) {
        errors.push('Delivery unit not found');
        return {
          valid: false,
          errors,
          warnings,
          po_unit_available: false,
          delivery_unit_available: false,
          serial_match: false,
          batch_match: false,
          product_match: false
        };
      }

      // Check if units are already linked
      const poUnitAvailable = !poUnit.unit_links?.length;
      const deliveryUnitAvailable = !deliveryUnit.unit_links?.length;

      if (!poUnitAvailable) {
        errors.push('Purchase order unit is already linked');
      }

      if (!deliveryUnitAvailable) {
        errors.push('Delivery unit is already linked');
      }

      // Check product matching
      const productMatch = poUnit.purchase_order_item?.product_id === deliveryUnit.delivery_item?.product_id;
      if (!productMatch) {
        errors.push('Product IDs do not match between purchase order and delivery');
      }

      // Check serial number matching (if both have serial numbers)
      let serialMatch = true;
      if (poUnit.serial_number && deliveryUnit.serial_number) {
        serialMatch = poUnit.serial_number === deliveryUnit.serial_number;
        if (!serialMatch) {
          warnings.push('Serial numbers do not match');
        }
      } else if (poUnit.serial_number || deliveryUnit.serial_number) {
        warnings.push('One unit has a serial number but the other does not');
      }

      // Check batch number matching (if both have batch numbers)
      let batchMatch = true;
      if (poUnit.batch_number && deliveryUnit.batch_number) {
        batchMatch = poUnit.batch_number === deliveryUnit.batch_number;
        if (!batchMatch) {
          warnings.push('Batch numbers do not match');
        }
      } else if (poUnit.batch_number || deliveryUnit.batch_number) {
        warnings.push('One unit has a batch number but the other does not');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        po_unit_available: poUnitAvailable,
        delivery_unit_available: deliveryUnitAvailable,
        serial_match: serialMatch,
        batch_match: batchMatch,
        product_match: productMatch
      };

    } catch (error) {
      console.error('Error validating unit linking:', error);
      errors.push('Failed to validate unit linking');
      return {
        valid: false,
        errors,
        warnings,
        po_unit_available: false,
        delivery_unit_available: false,
        serial_match: false,
        batch_match: false,
        product_match: false
      };
    }
  },

  async searchUnits(criteria: UnitSearchCriteria): Promise<{
    po_units: PurchaseOrderItemUnitWithDetails[];
    delivery_units: DeliveryItemUnitWithDetails[];
    unit_links: UnitDeliveryLinkWithDetails[];
  }> {
    const results = {
      po_units: [] as PurchaseOrderItemUnitWithDetails[],
      delivery_units: [] as DeliveryItemUnitWithDetails[],
      unit_links: [] as UnitDeliveryLinkWithDetails[]
    };

    // Search PO units
    let poQuery = supabase
      .from('purchase_order_item_units')
      .select(`
        *,
        purchase_order_item:purchase_order_items(
          id,
          purchase_order_id,
          product_id,
          model,
          quantity,
          unit_price
        ),
        unit_links:unit_delivery_links(*)
      `);

    if (criteria.purchase_order_id) {
      poQuery = poQuery.eq('purchase_order_item.purchase_order_id', criteria.purchase_order_id);
    }
    if (criteria.product_id) {
      poQuery = poQuery.eq('purchase_order_item.product_id', criteria.product_id);
    }
    if (criteria.serial_number) {
      poQuery = poQuery.eq('serial_number', criteria.serial_number);
    }
    if (criteria.batch_number) {
      poQuery = poQuery.eq('batch_number', criteria.batch_number);
    }
    if (criteria.unit_status) {
      poQuery = poQuery.in('unit_status', criteria.unit_status);
    }

    const { data: poUnits } = await poQuery;
    results.po_units = (poUnits || []) as unknown as PurchaseOrderItemUnitWithDetails[];

    // Search delivery units
    let deliveryQuery = supabase
      .from('delivery_item_units')
      .select(`
        *,
        delivery_item:delivery_items(
          id,
          delivery_id,
          product_id,
          quantity_delivered
        ),
        unit_links:unit_delivery_links(*)
      `);

    if (criteria.delivery_id) {
      deliveryQuery = deliveryQuery.eq('delivery_item.delivery_id', criteria.delivery_id);
    }
    if (criteria.product_id) {
      deliveryQuery = deliveryQuery.eq('delivery_item.product_id', criteria.product_id);
    }
    if (criteria.serial_number) {
      deliveryQuery = deliveryQuery.eq('serial_number', criteria.serial_number);
    }
    if (criteria.batch_number) {
      deliveryQuery = deliveryQuery.eq('batch_number', criteria.batch_number);
    }
    if (criteria.unit_status) {
      deliveryQuery = deliveryQuery.in('unit_status', criteria.unit_status);
    }

    const { data: deliveryUnits } = await deliveryQuery;
    results.delivery_units = (deliveryUnits || []) as unknown as DeliveryItemUnitWithDetails[];

    // Search unit links
    const { data: unitLinks } = await this.getUnitDeliveryLinks(
      criteria.purchase_order_id,
      criteria.delivery_id
    );
    results.unit_links = unitLinks;

    return results;
  },

  // Statistics and Reporting
  async getUnitTrackingStats(purchaseOrderId?: string, deliveryId?: string): Promise<UnitTrackingStats> {
    const searchResults = await this.searchUnits({
      purchase_order_id: purchaseOrderId,
      delivery_id: deliveryId
    });

    const stats: UnitTrackingStats = {
      total_po_units: searchResults.po_units.length,
      total_delivery_units: searchResults.delivery_units.length,
      linked_units: searchResults.unit_links.length,
      unlinked_po_units: searchResults.po_units.filter(u => !u.unit_links?.length).length,
      unlinked_delivery_units: searchResults.delivery_units.filter(u => !u.unit_links?.length).length,
      confirmed_links: searchResults.unit_links.filter(l => l.link_status === 'confirmed').length,
      disputed_links: searchResults.unit_links.filter(l => l.link_status === 'disputed').length,
      units_by_status: {}
    };

    // Count units by status
    const allStatuses = [
      ...searchResults.po_units.map(u => u.unit_status),
      ...searchResults.delivery_units.map(u => u.unit_status)
    ];

    allStatuses.forEach(status => {
      stats.units_by_status[status] = (stats.units_by_status[status] || 0) + 1;
    });

    return stats;
  },

  async generateReconciliationReport(
    purchaseOrderId: string,
    deliveryId?: string
  ): Promise<UnitReconciliationReport> {
    const searchResults = await this.searchUnits({
      purchase_order_id: purchaseOrderId,
      delivery_id: deliveryId
    });

    // Group units by purchase order item ID to track per line item
    const unitsByPOItem = new Map<string, {
      po_units: PurchaseOrderItemUnitWithDetails[];
      linked_units: number;
      total_units: number;
    }>();

    // Process PO units by item
    for (const poUnit of searchResults.po_units) {
      const itemId = poUnit.purchase_order_item_id;
      if (!unitsByPOItem.has(itemId)) {
        unitsByPOItem.set(itemId, {
          po_units: [],
          linked_units: 0,
          total_units: 0
        });
      }
      
      const itemData = unitsByPOItem.get(itemId)!;
      itemData.po_units.push(poUnit);
      itemData.total_units++;
      
      if (poUnit.unit_links?.length) {
        itemData.linked_units++;
      }
    }

    // Find unmatched units - those belonging to PO line items that are not fully fulfilled
    const unmatched_po_units = searchResults.po_units.filter(u => {
      if (!u.unit_links?.length) return true; // Unlinked units are unmatched
      
      const itemData = unitsByPOItem.get(u.purchase_order_item_id);
      return itemData ? itemData.linked_units < itemData.total_units : true;
    });

    const unmatched_delivery_units = searchResults.delivery_units.filter(u => !u.unit_links?.length);
    
    const mismatched_serials = searchResults.unit_links.filter(link => {
      const poSerial = link.purchase_order_unit?.serial_number;
      const deliverySerial = link.delivery_unit?.serial_number;
      return poSerial && deliverySerial && poSerial !== deliverySerial;
    });

    // Calculate completion based on PO line items, not total units
    let totalPOItems = 0;
    let fullyFulfilledPOItems = 0;
    
    for (const itemData of unitsByPOItem.values()) {
      totalPOItems++;
      if (itemData.linked_units >= itemData.total_units) {
        fullyFulfilledPOItems++;
      }
    }

    const completion_percentage = totalPOItems > 0 
      ? (fullyFulfilledPOItems / totalPOItems) * 100 
      : 0;

    const stats = await this.getUnitTrackingStats(purchaseOrderId, deliveryId);

    return {
      purchase_order_id: purchaseOrderId,
      delivery_id: deliveryId,
      total_ordered: stats.total_po_units,
      total_delivered: stats.total_delivery_units,
      total_linked: stats.linked_units,
      unmatched_po_units,
      unmatched_delivery_units,
      mismatched_serials,
      status_summary: stats.units_by_status,
      completion_percentage
    };
  }
};
import React, { useEffect, useState } from "react";
import "./EstimateModule.css";

const Section = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totals, setTotals] = useState({
    grandTotal: 0,
    sectionTotals: {},
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("http://localhost:3000/db.json");
      const jsonData = await response.json();
      const newSection = jsonData.data.sections.map((s) => {
        return { ...s, hide: true };
      });
      setData({ ...jsonData.data, sections: newSection });
      calculateInitialTotals(jsonData.data);
      setLoading(false);
    } catch (error) {
      setError(error);
      console.error("Error loading JSON:", error);
      setLoading(false);
    }
  };

  const calculateInitialTotals = (estimateData) => {
    if (!estimateData?.sections) return;

    const sectionTotals = {};
    let grandTotal = 0;

    estimateData.sections.forEach((section) => {
      const sectionTotal = section.items.reduce((acc, item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const unitCost = parseFloat(item.unit_cost) / 100 || 0;
        const itemTotal = quantity * unitCost;
        return acc + itemTotal;
      }, 0);

      sectionTotals[section.section_id] = sectionTotal;
      grandTotal += sectionTotal;
    });

    setTotals({ grandTotal, sectionTotals });
  };

  const handleItemUpdate = (sectionId, itemId, field, value) => {
    const updatedData = {
      ...data,
      sections: data.sections.map((section) => {
        if (section.section_id === sectionId) {
          return {
            ...section,
            items: section.items.map((item) => {
              if (item.item_id === itemId) {
                return { ...item, [field]: value };
              }
              return item;
            }),
          };
        }
        return section;
      }),
    };

    setData(updatedData);
    calculateInitialTotals(updatedData);
  };

  const openSection = (sectionId, sectionHide) => {
    const updatedData = {
      ...data,
      sections: data.sections.map((section) => {
        if (section.section_id === sectionId) {
          return {
            ...section,
            hide: !sectionHide,
          };
        }
        return section;
      }),
    };

    setData(updatedData);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="no-data">No estimate data available</div>;

  return (
    <div className="estimate-container">
      <div className="estimate-header">
        <h1>Estimate #{data.estimate_id}</h1>
        <div className="grand-total">
          Grand Total: $
          {totals.grandTotal.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      </div>

      {data.sections.map((section) => (
        <div key={section.section_id} className="section-card">
          <div className="section-header">
            <h2>
              <span
                className="hide-icon"
                onClick={()=>openSection(section.section_id, section.hide)}
              >
                {section.hide ? "➕" : "➖"}
              </span>{" "}
              {section.section_name}
            </h2>
            <div className="section-total">
              Section Total: $
              {totals.sectionTotals[section.section_id]?.toLocaleString(
                undefined,
                { minimumFractionDigits: 2, maximumFractionDigits: 2 }
              )}
            </div>
          </div>

          <div className={`table-container ${section.hide ? "hide" : ""}`}>
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Item Name</th>
                  <th className="text-right">QTY</th>
                  <th className="text-right">Unit Cost</th>
                  <th>Unit</th>
                  <th className="text-right">Total</th>
                  <th className="text-center">Tax</th>
                  <th>Cost Code</th>
                </tr>
              </thead>
              <tbody>
                {section.items.map((item) => {
                  item.apply_global_tax !== "0" &&
                    console.log(item.apply_global_tax, item);
                  const quantity = parseFloat(item.quantity) || 0;
                  const unitCost = parseFloat(item.unit_cost) / 100 || 0;
                  const total = quantity * unitCost;

                  return (
                    <tr key={item.item_id}>
                      <td>{item.item_type_name}</td>
                      <td>{item.source_name}</td>
                      <td className="text-right">
                        <input
                          type="number"
                          value={quantity}
                          className="number-input"
                          onChange={(e) =>
                            handleItemUpdate(
                              section.section_id,
                              item.item_id,
                              "quantity",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td className="text-right">
                        <input
                          type="number"
                          value={unitCost}
                          className="number-input"
                          onChange={(e) =>
                            handleItemUpdate(
                              section.section_id,
                              item.item_id,
                              "unit_cost",
                              e.target.value * 100
                            )
                          }
                        />
                      </td>
                      <td>{item.unit}</td>
                      <td className="text-right">
                        $
                        {total.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td>{item.apply_global_tax !== "0" && "✔"}</td>
                      <td>{item.cost_code}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Section;

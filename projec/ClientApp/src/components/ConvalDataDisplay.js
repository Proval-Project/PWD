import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Row, Col, Form, Table } from 'react-bootstrap';
import { getFileStatus, downloadPdf, downloadCcv } from '../services/api';

const ConvalDataDisplay = ({ data, isLoading, onRecalculate, isProcessing, onFileStatusRefresh }) => {
  const [formData, setFormData] = useState({});
  const [fileStatus, setFileStatus] = useState({ pdfExists: false, ccvExists: false });
  const [downloading, setDownloading] = useState({ pdf: false, ccv: false });
  const [fluidType, setFluidType] = useState('n1'); // 'n1' 또는 'v1' 선택
  const [pressureType, setPressureType] = useState('p2'); // 'p2' 또는 'dp' 선택
  const [flowType, setFlowType] = useState('qm'); // 'qm' 또는 'qn' 선택
  const [massType, setMassType] = useState('density'); // 'density' 또는 'molecular' 선택
  
  useEffect(() => {
    if (data) {
      setFormData(data);
    }
  }, [data]);

  // 백엔드 플래그 값으로 토글 동기화
  useEffect(() => {
    if (!data) return;
    const toBool = (v) => {
      if (v === null || v === undefined) return undefined;
      if (typeof v === 'boolean') return v;
      if (typeof v === 'number') return v !== 0;
      const s = String(v).trim().toLowerCase();
      if (s === 'true' || s === '1' || s === 'y') return true;
      if (s === 'false' || s === '0' || s === 'n') return false;
      return undefined;
    };
    const qm = toBool(data.IsQM);
    if (qm !== undefined) setFlowType(qm ? 'qm' : 'qn');
    const p2 = toBool(data.IsP2);
    if (p2 !== undefined) setPressureType(p2 ? 'p2' : 'dp');
    const n1 = toBool(data.IsN1);
    if (n1 !== undefined) setFluidType(n1 ? 'n1' : 'v1');
    const dens = toBool(data.IsDensity);
    if (dens !== undefined) setMassType(dens ? 'density' : 'molecular');
  }, [data?.IsQM, data?.IsP2, data?.IsN1, data?.IsDensity]);

  // Density/Molecular 상호배타 전환 시 반대쪽 값 초기화 - 자동 초기화 제거
  // useEffect(() => {
  //   setFormData((prev) => {
  //     if (!prev) return prev;
  //     if (massType === 'density') {
  //       return { ...prev, Molecular: '', MolecularWeightUnit: '', IsDensity: true };
  //     }
  //     return { ...prev, Density: '', DensityUnit: '', IsDensity: false };
  //   });
  // }, [massType]);

  // p2/dp 토글 변경 시 formData에 저장
  useEffect(() => {
    setFormData((prev) => {
      if (!prev) return prev;
      return { ...prev, IsP2: pressureType === 'p2' };
    });
  }, [pressureType]);

  // qm/qn 토글 변경 시 formData에 저장
  useEffect(() => {
    setFormData((prev) => {
      if (!prev) return prev;
      return { ...prev, IsQM: flowType === 'qm' };
    });
  }, [flowType]);

  // n1/v1 토글 변경 시 formData에 저장
  useEffect(() => {
    setFormData((prev) => {
      if (!prev) return prev;
      return { ...prev, IsN1: fluidType === 'n1' };
    });
  }, [fluidType]);

  // massType 토글 변경 시 formData에 저장 (초기화 없이)
  useEffect(() => {
    setFormData((prev) => {
      if (!prev) return prev;
      return { ...prev, IsDensity: massType === 'density' };
    });
  }, [massType]);

  // 평탄화된 구조로 입력값 관리
  const handleInputChange = (field, _unused, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    // 무한 루프 방지를 위해 onDataChange 호출 제거
  };

  const renderConvalData = () => {
    if (!data || Object.keys(data).length === 0) {
      return (
        <div className="text-center text-muted p-3">
          CONVAL 데이터가 없습니다.
        </div>
      );
    }
    
    return (
      <div>
        <h6 className="mb-3">CONVAL DATA (CONVAL 데이터)</h6>
        
        {/* Medium selection and state */}
        <div className="mb-3">
          <h6 className="mb-2">Medium selection and state</h6>
          <Table bordered size="sm">
            <tbody>
              <tr>
                <td className="fw-bold" style={{width: '30%'}}>Medium</td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.Medium || ''}
                    onChange={(e) => handleInputChange('Medium', null, e.target.value)}
                  />
                </td>
              </tr>
              <tr>
                <td className="fw-bold">Fluid</td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.Fluid || ''}
                    onChange={(e) => handleInputChange('Fluid', null, e.target.value)}
                  />
                </td>
              </tr>
              <tr>
                <td className="fw-bold">
                  <div className="d-flex align-items-center gap-3">
                    
                    <div className="d-flex gap-2">
                      <Form.Check
                        type="radio"
                        id="density-radio"
                        name="massType"
                        label="Density"
                        checked={massType === 'density'}
                        onChange={() => setMassType('density')}
                      />
                      <Form.Check
                        type="radio"
                        id="molecular-radio"
                        name="massType"
                        label="Molecular"
                        checked={massType === 'molecular'}
                        onChange={() => setMassType('molecular')}
                      />
                    </div>
                  </div>
                </td>
                
              </tr>
              <tr>
                <td className="fw-bold">Density</td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <Form.Control
                      size="sm"
                      value={formData.Density || ''}
                      onChange={(e) => handleInputChange('Density', null, e.target.value)}
                      style={{ maxWidth: 200 }}
                      disabled={massType !== 'density'}
                    />
                    <Form.Control
                      size="sm"
                      placeholder="Unit"
                      value={formData.DensityUnit || ''}
                      onChange={(e) => setFormData({ ...formData, DensityUnit: e.target.value })}
                      style={{ maxWidth: 140 }}
                      disabled={massType !== 'density'}
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <td className="fw-bold">Molecular</td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <Form.Control
                      size="sm"
                      value={formData.Molecular || ''}
                      onChange={(e) => handleInputChange('Molecular', null, e.target.value)}
                      style={{ maxWidth: 200 }}
                      disabled={massType !== 'molecular'}
                    />
                    <Form.Control
                      size="sm"
                      placeholder="Unit"
                      value={formData.MolecularWeightUnit || ''}
                      onChange={(e) => setFormData({ ...formData, MolecularWeightUnit: e.target.value })}
                      style={{ maxWidth: 140 }}
                      disabled={massType !== 'molecular'}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </Table>
        </div>

        {/* Operating data */}
        <div className="mb-3">
          <h6 className="mb-2">Operating data</h6>
          <Table bordered size="sm">
            <thead>
              <tr>
                <th>항목</th>
                <th>Max</th>
                <th>Normal</th>
                <th>Min</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="fw-bold">t1</td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.t1Max || ''}
                    onChange={(e) => handleInputChange('t1Max', null, e.target.value)}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.t1Normal || ''}
                    onChange={(e) => handleInputChange('t1Normal', null, e.target.value)}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.t1Min || ''}
                    onChange={(e) => handleInputChange('t1Min', null, e.target.value)}
                  />
                </td>
                                 <td>
                  <Form.Control
                    size="sm"
                    placeholder="Unit"
                    value={formData.t1Unit || ''}
                    onChange={(e) => setFormData({ ...formData, t1Unit: e.target.value })}
                  />
                </td>
              </tr>
              <tr>
                <td className="fw-bold">p1</td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.p1Max || ''}
                    onChange={(e) => handleInputChange('p1Max', null, e.target.value)}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.p1Normal || ''}
                    onChange={(e) => handleInputChange('p1Normal', null, e.target.value)}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.p1Min || ''}
                    onChange={(e) => handleInputChange('p1Min', null, e.target.value)}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    placeholder="Unit"
                    value={formData.PressureUnit || ''}
                    onChange={(e) => setFormData({ ...formData, PressureUnit: e.target.value })}
                  />
                </td>
              </tr>
              <tr>
                <td className="fw-bold">
                  <div className="d-flex align-items-center gap-3">
                    
                    <div className="d-flex gap-2">
                      <Form.Check
                        type="radio"
                        id="p2-radio"
                        name="pressureType"
                        label="p2"
                        checked={pressureType === 'p2'}
                        onChange={() => setPressureType('p2')}
                      />
                      <Form.Check
                        type="radio"
                        id="dp-radio"
                        name="pressureType"
                        label="Δp"
                        checked={pressureType === 'dp'}
                        onChange={() => setPressureType('dp')}
                      />
                    </div>
                  </div>
                </td>
                
              </tr>
              <tr>
                <td className="fw-bold">
                  p2
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.p2Max || ''}
                    onChange={(e) => handleInputChange('p2Max', null, e.target.value)}
                    disabled={pressureType !== 'p2'}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.p2Normal || ''}
                    onChange={(e) => handleInputChange('p2Normal', null, e.target.value)}
                    disabled={pressureType !== 'p2'}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.p2Min || ''}
                    onChange={(e) => handleInputChange('p2Min', null, e.target.value)}
                    disabled={pressureType !== 'p2'}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    placeholder="Unit"
                    value={formData.PressureUnit || ''}
                    onChange={(e) => setFormData({ ...formData, PressureUnit: e.target.value })}
                   
                  />
                </td>
              </tr>
              <tr>
                <td className="fw-bold">
                  Δp
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.dpMax || ''}
                    onChange={(e) => handleInputChange('dpMax', null, e.target.value)}
                    disabled={pressureType !== 'dp'}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.dpNormal || ''}
                    onChange={(e) => handleInputChange('dpNormal', null, e.target.value)}
                    disabled={pressureType !== 'dp'}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.dpMin || ''}
                    onChange={(e) => handleInputChange('dpMin', null, e.target.value)}
                    disabled={pressureType !== 'dp'}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    placeholder="Unit"
                    value={formData.PressureUnit || ''}
                    onChange={(e) => setFormData({ ...formData, PressureUnit: e.target.value })}
                    
                  />
                </td>
              </tr>
              <tr>
                <td className="fw-bold">CV</td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.CVMax || ''}
                    readOnly
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.CVNormal || ''}
                    readOnly
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.CVMin || ''}
                    readOnly
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    placeholder="Unit"
                    value={formData.CVUnit || ''}
                    onChange={(e) => setFormData({ ...formData, CVUnit: e.target.value })}
                  />
                </td>
              </tr>
              <tr>
                <td className="fw-bold">
                  <div className="d-flex align-items-center gap-3">
                    
                    <div className="d-flex gap-2">
                      <Form.Check
                        type="radio"
                        id="qm-radio"
                        name="flowType"
                        label="qm"
                        checked={flowType === 'qm'}
                        onChange={() => setFlowType('qm')}
                      />
                      <Form.Check
                        type="radio"
                        id="qn-radio"
                        name="flowType"
                        label="qn"
                        checked={flowType === 'qn'}
                        onChange={() => setFlowType('qn')}
                      />
                    </div>
                  </div>
                </td>
              
              </tr>
              <tr>
                <td className="fw-bold">
                  qm
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.qmMax || ''}
                    onChange={(e) => handleInputChange('qmMax', null, e.target.value)}
                    disabled={flowType !== 'qm'}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.qmNormal || ''}
                    onChange={(e) => handleInputChange('qmNormal', null, e.target.value)}
                    disabled={flowType !== 'qm'}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.qmMin || ''}
                    onChange={(e) => handleInputChange('qmMin', null, e.target.value)}
                    disabled={flowType !== 'qm'}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    placeholder="Unit"
                    value={formData.qmUnit || ''}
                    onChange={(e) => setFormData({ ...formData, qmUnit: e.target.value })}
                    
                  />
                </td>
              </tr>
              <tr>
                <td className="fw-bold">
                  qn
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.qnMax || ''}
                    onChange={(e) => handleInputChange('qnMax', null, e.target.value)}
                    disabled={flowType !== 'qn'}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.qnNormal || ''}
                    onChange={(e) => handleInputChange('qnNormal', null, e.target.value)}
                    disabled={flowType !== 'qn'}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.qnMin || ''}
                    onChange={(e) => handleInputChange('qnMin', null, e.target.value)}
                    disabled={flowType !== 'qn'}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    placeholder="Unit"
                    value={formData.qnUnit || ''}
                    onChange={(e) => setFormData({ ...formData, qnUnit: e.target.value })}
                    
                  />
                </td>
              </tr>
              <tr>
                <td className="fw-bold">s/s100</td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.SS100Max || ''}
                    readOnly
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.SS100Nor || ''}
                    readOnly
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.SS100Min || ''}
                    readOnly
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </td>
                <td>%</td>
              </tr>
              <tr>
                <td className="fw-bold">LpAe</td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.LpAeMax || ''}
                    readOnly
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.LpAeNormal || ''}
                    readOnly
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.LpAeMin || ''}
                    readOnly
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </td>
                <td>dB(A)</td>
              </tr>
              <tr>
                <td className="fw-bold">Warning State</td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.WarningStateMax || ''}
                    readOnly
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.WarningStateNormal || ''}
                    readOnly
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.WarningStateMin || ''}
                    readOnly
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </td>
                <td></td>
              </tr>
              <tr>
                <td className="fw-bold">Warning Type</td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.WarningTypeMax || ''}
                    readOnly
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.WarningTypeNormal || ''}
                    readOnly
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={formData.WarningTypeMin || ''}
                    readOnly
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </td>
                <td></td>
              </tr>
            </tbody>
          </Table>
        </div>
      </div>
    );
  };

  const renderFluidOperatingData = () => {
    return (
      <div className="mt-4">
        <h6 className="mb-3">Fluid Operating data (유체 작동 데이터)</h6>
        <Table bordered size="sm">
          <tbody>
            <tr>
              <td className="fw-bold" style={{width: '30%'}}>ϱ1</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    placeholder="Max"
                    value={formData.FluidP1Max || ''}
                    onChange={(e) => handleInputChange('FluidP1Max', null, e.target.value)}
                    style={{ maxWidth: 120 }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Normal"
                    value={formData.FluidP1Nor || ''}
                    onChange={(e) => handleInputChange('FluidP1Nor', null, e.target.value)}
                    style={{ maxWidth: 120 }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Min"
                    value={formData.FluidP1Min || ''}
                    onChange={(e) => handleInputChange('FluidP1Min', null, e.target.value)}
                    style={{ maxWidth: 120 }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Unit"
                    value={formData.FluidPUnit || ''}
                    onChange={(e) => setFormData({ ...formData, FluidPUnit: e.target.value })}
                    style={{ maxWidth: 140 }}
                  />
                </div>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">ϱ2</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    placeholder="Max"
                    value={formData.FluidP2Max || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Normal"
                    value={formData.FluidP2Nor || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Min"
                    value={formData.FluidP2Min || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Unit"
                    value={formData.FluidPUnit || ''}
                    onChange={(e) => setFormData({ ...formData, FluidPUnit: e.target.value })}
                    style={{ maxWidth: 140 }}
                  />
                </div>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">
                <div className="d-flex align-items-center gap-3">
                  
                  <div className="d-flex gap-2">
                    <Form.Check
                      type="radio"
                      id="n1-radio"
                      name="fluidType"
                      label="η1"
                      checked={fluidType === 'n1'}
                      onChange={() => setFluidType('n1')}
                    />
                    <Form.Check
                      type="radio"
                      id="v1-radio"
                      name="fluidType"
                      label="ν1"
                      checked={fluidType === 'v1'}
                      onChange={() => setFluidType('v1')}
                    />
                  </div>
                </div>
              </td>
              
            </tr>
            <tr>
              <td className="fw-bold">
              η1
              </td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    placeholder="Max"
                    value={formData.FluidN1Max || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                    disabled={fluidType !== 'n1'}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Normal"
                    value={formData.FluidN1Nor || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                    disabled={fluidType !== 'n1'}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Min"
                    value={formData.FluidN1Min || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                    disabled={fluidType !== 'n1'}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Unit"
                    value={formData.FluidN1Unit || ''}
                    onChange={(e) => setFormData({ ...formData, FluidN1Unit: e.target.value })}
                    style={{ maxWidth: 140 }}
                    
                  />
                </div>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">
              ν1
              </td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    placeholder="Max"
                    value={formData.FluidV1Max || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                    disabled={fluidType !== 'v1'}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Normal"
                    value={formData.FluidV1Nor || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                    disabled={fluidType !== 'v1'}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Min"
                    value={formData.FluidV1Min || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                    disabled={fluidType !== 'v1'}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Unit"
                    value={formData.FluidV1Unit || ''}
                    onChange={(e) => setFormData({ ...formData, FluidV1Unit: e.target.value })}
                    style={{ maxWidth: 140 }}
                    
                  />
                </div>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">pv1</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    placeholder="Max"
                    value={formData.FluidPV1Max || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Normal"
                    value={formData.FluidPV1Nor || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Min"
                    value={formData.FluidPV1Min || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Unit"
                    value={formData.FluidPV1Unit || ''}
                    onChange={(e) => setFormData({ ...formData, FluidPV1Unit: e.target.value })}
                    style={{ maxWidth: 140 }}
                  />
                </div>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">tv1</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    placeholder="Max"
                    value={formData.FluidTV1Max || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Normal"
                    value={formData.FluidTV1Nor || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Min"
                    value={formData.FluidTV1Min || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Unit"
                    value={formData.FluidTV1Unit || ''}
                    onChange={(e) => setFormData({ ...formData, FluidTV1Unit: e.target.value })}
                    style={{ maxWidth: 140 }}
                  />
                </div>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">cF1</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    placeholder="Max"
                    value={formData.FluidCF1Max || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Normal"
                    value={formData.FluidCF1Nor || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Min"
                    value={formData.FluidCF1Min || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Unit"
                    value={formData.FluidCF1Unit || ''}
                    onChange={(e) => setFormData({ ...formData, FluidCF1Unit: e.target.value })}
                    style={{ maxWidth: 140 }}
                  />
                </div>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">ϰ</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    placeholder="Max"
                    value={formData.FluidKMax || ''}
                    onChange={(e) => handleInputChange('FluidKMax', null, e.target.value)}
                    style={{ maxWidth: 120 }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Normal"
                    value={formData.FluidKNor || ''}
                    onChange={(e) => handleInputChange('FluidKNor', null, e.target.value)}
                    style={{ maxWidth: 120 }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Min"
                    value={formData.FluidKMin || ''}
                    onChange={(e) => handleInputChange('FluidKMin', null, e.target.value)}
                    style={{ maxWidth: 120 }}
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </Table>
      </div>
    );
  };

  const renderValveConfiguration = () => {
    return (
      <div className="mt-4">
        <h6 className="mb-3">Valve Configuration (밸브 구성)</h6>
        <Table bordered size="sm">
          <tbody>
                         <tr>
               <td className="fw-bold" style={{width: '30%'}}>Valve type</td>
               <td>
                 <Form.Control
                   size="sm"
                   value={formData.ValveType || ''}
                   readOnly
                   style={{ backgroundColor: '#e9ecef' }}
                 />
               </td>
             </tr>
            <tr>
              <td className="fw-bold">Trim type</td>
              <td>
                <Form.Control
                  size="sm"
                                      value={formData.CONVALTrim || ''}
                  onChange={(e) => handleInputChange('CONVALTrim', null, e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td className="fw-bold">Flow direction</td>
              <td>
                <Form.Control
                  size="sm"
                                      value={formData.FlowDirection || ''}
                  onChange={(e) => handleInputChange('FlowDirection', null, e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td className="fw-bold">Valve performance class</td>
              <td>
                <Form.Control
                  size="sm"
                                      value={formData.ValvePerformClass || ''}
                  onChange={(e) => handleInputChange('ValvePerformClass', null, e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td className="fw-bold">Protection</td>
              <td>
                <Form.Control
                  size="sm"
                                      value={formData.Protection || ''}
                  onChange={(e) => handleInputChange('Protection', null, e.target.value)}
                />
              </td>
            </tr>
          </tbody>
        </Table>
      </div>
    );
  };

  const renderValveData = () => {
    return (
      <div className="mt-4">
        <h6 className="mb-3">Valve data (밸브 데이터)</h6>
        <Table bordered size="sm">
          <tbody>
            <tr>
              <td className="fw-bold" style={{width: '30%'}}>Basic characteristic</td>
              <td>
                <Form.Control
                  size="sm"
                  value={formData.BasicCharacter || ''}
                  onChange={(e) => handleInputChange('BasicCharacter', null, e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td className="fw-bold">Theoretical rangeability</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    value={formData.TheoreticalRangeability || ''}
                    onChange={(e) => handleInputChange('TheoreticalRangeability', null, e.target.value)}
                  />
                  <span>%</span>
                </div>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">Flow coefficient</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    value={formData.FlowCoeff || ''}
                    readOnly
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Unit"
                    value={formData.FlowCoeffUnit || ''}
                    onChange={(e) => setFormData({ ...formData, FlowCoeffUnit: e.target.value })}
                    style={{ maxWidth: 140 }}
                  />
                </div>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">Normal flow coefficient</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    value={formData.NorFlowCoeff || ''}
                    onChange={(e) => handleInputChange('NorFlowCoeff', null, e.target.value)}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Unit"
                    value={formData.FlowCoeffUnit || ''}
                    onChange={(e) => setFormData({ ...formData, FlowCoeffUnit: e.target.value })}
                    style={{ maxWidth: 140 }}
                  />
                </div>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">Size pressure class</td>
              <td>
                <Form.Control
                  size="sm"
                  value={formData.SizePressureClass || ''}
                  onChange={(e) => handleInputChange('SizePressureClass', null, e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td className="fw-bold">Suggested valve size</td>
              <td>
                <Form.Control
                  size="sm"
                  value={formData.SuggestedValveSize || ''}
                  readOnly
                  style={{ backgroundColor: '#e9ecef' }}
                />
              </td>
            </tr>
                         <tr>
               <td className="fw-bold">Selected valve size</td>
               <td>
                 <Form.Control
                   size="sm"
                   value={formData.BodySize || ''}
                   onChange={(e) => handleInputChange('BodySize', null, e.target.value)}
                 />
               </td>
             </tr>
             <tr>
               <td className="fw-bold">Pressure class</td>
               <td>
                 <Form.Control
                   size="sm"
                   value={formData.PressureClass || ''}
                   onChange={(e) => handleInputChange('PressureClass', null, e.target.value)}
                 />
               </td>
             </tr>
          </tbody>
        </Table>
      </div>
    );
  };

  const renderLoadDependentValues = () => {
    return (
      <div className="mt-4">
        <h6 className="mb-3">Load-dependent values (부하 의존 값)</h6>
        <Table bordered size="sm">
          <tbody>
            <tr>
              <td className="fw-bold" style={{width: '30%'}}>s/s100</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    placeholder="Max"
                    value={formData.SS100Max || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Normal"
                    value={formData.SS100Nor || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Min"
                    value={formData.SS100Min || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <span className="ms-2">%</span>
                </div>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">u1</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    placeholder="Max"
                    value={formData.U1Max || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Normal"
                    value={formData.U1Nor || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Min"
                    value={formData.U1Min || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Unit"
                    value={formData.U1Unit || ''}
                    onChange={(e) => setFormData({ ...formData, U1Unit: e.target.value })}
                    style={{ maxWidth: 120 }}
                  />
                </div>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">u2</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    placeholder="Max"
                    value={formData.U2Max || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Normal"
                    value={formData.U2Nor || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Min"
                    value={formData.U2Min || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Unit"
                    value={formData.U1Unit || ''}
                    onChange={(e) => setFormData({ ...formData, U1Unit: e.target.value })}
                    style={{ maxWidth: 120 }}
                  />
                </div>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">LpAe</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    placeholder="Max"
                    value={formData.LpAeMax || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Normal"
                    value={formData.LpAeNormal || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <Form.Control
                    size="sm"
                    placeholder="Min"
                    value={formData.LpAeMin || ''}
                    readOnly
                    style={{ maxWidth: 120, backgroundColor: '#e9ecef' }}
                  />
                  <span className="ms-2">dB(A)</span>
                </div>
              </td>
            </tr>
          </tbody>
        </Table>
      </div>
    );
  };

  // 파일 상태 확인
  useEffect(() => {
    if (data?.TempEstimateNo) {
      checkFileStatus(data.TempEstimateNo);
    }
  }, [data?.TempEstimateNo]);

  // CONVAL 재계산 완료 후 파일 상태 새로고침
  useEffect(() => {
    if (!isProcessing && data?.TempEstimateNo) {
      // 재계산이 완료되면 파일 상태를 다시 확인
      setTimeout(() => {
        checkFileStatus(data.TempEstimateNo);
      }, 2000); // 2초 후 확인 (파일 생성 시간 고려)
    }
  }, [isProcessing, data?.TempEstimateNo]);

  const checkFileStatus = async (estimateNo) => {
    try {
      const status = await getFileStatus(estimateNo);
      setFileStatus({
        pdfExists: status.pdfExists,
        ccvExists: status.ccvExists
      });
      if (onFileStatusRefresh) {
        onFileStatusRefresh();
      }
    } catch (error) {
      console.error('파일 상태 확인 실패:', error);
      setFileStatus({ pdfExists: false, ccvExists: false });
      if (onFileStatusRefresh) {
        onFileStatusRefresh();
      }
    }
  };

  // PDF 파일 다운로드
  const handlePdfDownload = async () => {
    if (!data?.TempEstimateNo) return;
    
    setDownloading(prev => ({ ...prev, pdf: true }));
    try {
      await downloadPdf(data.TempEstimateNo);
    } catch (error) {
      alert('PDF 파일 다운로드 실패: ' + error.message);
    } finally {
      setDownloading(prev => ({ ...prev, pdf: false }));
    }
  };

  // CCV 파일 다운로드
  const handleCcvDownload = async () => {
    if (!data?.TempEstimateNo) return;
    
    setDownloading(prev => ({ ...prev, ccv: true }));
    try {
      await downloadCcv(data.TempEstimateNo);
    } catch (error) {
      alert('CCV 파일 다운로드 실패: ' + error.message);
    } finally {
      setDownloading(prev => ({ ...prev, ccv: false }));
    }
  };

  // PDF 파일 바로 읽기 (새 탭에서 열기)
  const handlePdfView = async () => {
    if (!data?.TempEstimateNo) return;
    
    try {
      // api.js의 downloadPdf 함수와 동일한 방식으로 처리
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://localhost:7001/api'}/conval/download/pdf/${data.TempEstimateNo}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        // 메모리 누수 방지를 위해 나중에 URL 해제
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else {
        alert('PDF 파일을 열 수 없습니다.');
      }
    } catch (error) {
      alert('PDF 파일 열기 실패: ' + error.message);
    }
  };

  // CCV 파일 바로 읽기 (새 탭에서 열기)
  const handleCcvView = async () => {
    if (!data?.TempEstimateNo) return;
    
    try {
      // api.js의 downloadCcv 함수와 동일한 방식으로 처리
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://localhost:7001/api'}/conval/download/ccv/${data.TempEstimateNo}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        // 메모리 누수 방지를 위해 나중에 URL 해제
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else {
        alert('CCV 파일을 열 수 없습니다.');
      }
    } catch (error) {
      alert('CCV 파일 열기 실패: ' + error.message);
    }
  };

  const renderFileDownload = () => {
    return (
      <div className="mt-4">
        <h6 className="mb-3">파일 다운로드 (File Download)</h6>
        <Row>
          <Col md={6}>
            <div className="mb-2">
              <strong>PDF 파일</strong>
              
            </div>
            <div className="d-flex gap-2">
              <Button 
                size="sm" 
                variant="outline-primary"
                onClick={handlePdfDownload}
                disabled={downloading.pdf}
              >
                {downloading.pdf ? '다운로드 중...' : '다운로드'}
              </Button>
              <Button 
                size="sm" 
                variant="outline-secondary"
                onClick={handlePdfView}
              >
                바로읽기
              </Button>
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-2">
              <strong>CCV 파일</strong>
              
            </div>
            <div className="d-flex gap-2">
              <Button 
                size="sm" 
                variant="outline-primary"
                onClick={handleCcvDownload}
                disabled={downloading.ccv}
              >
                {downloading.ccv ? '다운로드 중...' : '다운로드'}
              </Button>
              <Button 
                size="sm" 
                variant="outline-secondary"
                onClick={handleCcvView}
              >
                바로읽기
              </Button>
            </div>
          </Col>
        </Row>
        
      </div>
    );
  };

  // CONVAL 재호출 콘솔 출력용 핸들러 추가
  const handleRecalculate = async () => {
    console.log('[CONVAL] 재호출 버튼 클릭');
    if (onRecalculate) {
      try {
        console.log('[CONVAL] 재호출 요청 시작');
        // 현재 폼 데이터를 포함하여 전달
        const currentData = {
          ...formData,
          IsP2: pressureType === 'p2',
          IsQM: flowType === 'qm',
          IsN1: fluidType === 'n1',
          IsDensity: massType === 'density'
        };
        console.log('[CONVAL] 전달할 데이터:', currentData);
        const result = await onRecalculate(currentData);
        console.log('[CONVAL] 재호출 응답:', result);
      } catch (error) {
        console.error('[CONVAL] 재호출 중 오류:', error);
      }
    }
  };

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5>CONVAL Data (DataSheetLv3)</h5>
        <Button 
          variant="warning" 
          size="sm"
          onClick={handleRecalculate}
          disabled={isProcessing || isLoading}
        >
          {isProcessing ? (
            <>
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">처리 중...</span>
              </div>
              처리 중...
            </>
          ) : (
            'CONVAL 재호출'
          )}
        </Button>
      </Card.Header>
      <Card.Body>
        {isLoading ? (
          <div className="processing-indicator">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">로딩 중...</span>
            </div>
            <span className="ms-2">데이터 로딩 중...</span>
          </div>
        ) : (
          <div className="data-display">
            {renderConvalData()}
            {renderFluidOperatingData()}
            {renderValveConfiguration()}
            {renderValveData()}
            {renderLoadDependentValues()}
            {renderFileDownload()}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ConvalDataDisplay; 
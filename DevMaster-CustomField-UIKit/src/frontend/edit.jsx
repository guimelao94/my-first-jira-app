import React, { useState, useEffect } from 'react';
import ForgeReconciler, {
  Form,
  Label,
  Textfield,
  useForm,
  FormSection,
  FormFooter,
  ButtonGroup,
  LoadingButton,
  Button,
} from "@forge/react";
import { view } from '@forge/bridge';

const Edit = () => {
  const [renderContext, setRenderContext] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { handleSubmit, register, getFieldId, getValues } = useForm();

  useEffect(() => {
    view.getContext().then((context) => setRenderContext(context.extension.renderContext));
  }, []);

  const onSubmit = async () => {
    try {
      setIsLoading(true);
      const { fieldName } = getValues();
      await view.submit(fieldName || 'world');
    } catch (e) {
      setIsLoading(false);
      console.error(e);
    }
  };

  return renderContext === 'issue-view' ? (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <FormSection>
        <Label labelFor={getFieldId('fieldName')}>
          Custom field value
        </Label>
        <Textfield {...register('fieldName')} />
      </FormSection>
      <FormFooter>
        <ButtonGroup>
          <Button appearance="subtle" onClick={view.close}>Close</Button>
          <LoadingButton appearance="primary" type="submit" isLoading={isLoading}>
            Submit
          </LoadingButton>
        </ButtonGroup>
      </FormFooter>
    </Form>
  ) : (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Label labelFor={getFieldId('fieldName')}>
        Custom field value
      </Label>
      <Textfield {...register('fieldName')} />
    </Form>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <Edit />
  </React.StrictMode>
);
